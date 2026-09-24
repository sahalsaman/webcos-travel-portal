import { tenantModel } from "@/lib/tenant-db";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { employeeUpdateSchema } from "@/lib/validations";
import "@/models";
import Employee from "@/models/Employee";
import User from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = employeeUpdateSchema.parse(await request.json());
    await connectDB();

    const current = await (await tenantModel(Employee)).findById(id);
    if (!current) return fail("Employee not found", 404);

    const nextEmail = (data.email ?? current.email).toLowerCase();
    let userId = current.user ?? null;

    if (data.portalAccess === true || (data.portalAccess === undefined && current.portalAccess)) {
      if (!userId && !data.portalPassword) return fail("Portal password is required", 422);
      const existingUser = await (await tenantModel(User)).findOne({ email: nextEmail });
      if (existingUser && String(existingUser._id) !== String(userId ?? "") && existingUser.role !== "vendor_employee" && existingUser.role !== "employee") {
        return fail("This email already belongs to another portal account", 409);
      }

      const update: Record<string, unknown> = {
        name: data.name ?? current.name,
        email: nextEmail,
        mobile: data.mobile ?? current.mobile,
        role: "vendor_employee",
      };
      if (data.portalPassword) update.password = await bcrypt.hash(data.portalPassword, 10);

      const user = userId
        ? await (await tenantModel(User)).findByIdAndUpdate(userId, { $set: update }, { returnDocument: "after" })
        : await (await tenantModel(User)).findOneAndUpdate(
            { email: nextEmail },
            { $set: update },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
          );
      userId = user?._id ?? null;
    }

    const update: Record<string, unknown> = { ...data };
    delete update.portalPassword;
    if (data.email !== undefined) update.email = nextEmail;
    if (data.joinedAt !== undefined) update.joinedAt = data.joinedAt ? new Date(data.joinedAt) : null;
    if (data.portalAccess === false) update.portalPages = [];
    if (data.portalAccess === true) update.user = userId;

    const employee = await (await tenantModel(Employee)).findByIdAndUpdate(id, update, { returnDocument: "after" }).lean();
    return ok(employee);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    await connectDB();
    const employee = await (await tenantModel(Employee)).findByIdAndDelete(id);
    if (!employee) return fail("Employee not found", 404);
    if (employee.user) {
      await (await tenantModel(User)).updateOne({ _id: employee.user, role: "vendor_employee" }, { $unset: { password: "" } });
    }
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
