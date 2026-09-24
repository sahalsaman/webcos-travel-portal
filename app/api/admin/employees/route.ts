import { tenantModel } from "@/lib/tenant-db";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { employeeSchema } from "@/lib/validations";
import "@/models";
import Employee from "@/models/Employee";
import User from "@/models/User";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    const employees = await (await tenantModel(Employee)).find({}).sort({ createdAt: -1 }).lean();
    return ok(employees);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = employeeSchema.parse(await request.json());
    await connectDB();

    const email = data.email.toLowerCase();
    let userId = null;
    if (data.portalAccess) {
      if (!data.portalPassword) return fail("Portal password is required", 422);
      const existingUser = await (await tenantModel(User)).findOne({ email });
      if (existingUser && existingUser.role !== "vendor_employee" && existingUser.role !== "employee") {
        return fail("This email already belongs to another portal account", 409);
      }
      const password = await bcrypt.hash(data.portalPassword, 10);
      const user = await (await tenantModel(User)).findOneAndUpdate(
        { email },
        {
          $set: { email, name: data.name, mobile: data.mobile, password, role: "vendor_employee" },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      userId = user._id;
    }

    const employeeData = { ...data };
    delete employeeData.portalPassword;
    const employee = await (await tenantModel(Employee)).create({
      ...employeeData,
      email,
      user: userId,
      portalPages: data.portalAccess ? data.portalPages : [],
      joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
    });
    return ok({ id: String(employee._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}
