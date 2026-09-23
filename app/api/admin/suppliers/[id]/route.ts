import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { supplierSchema } from "@/lib/validations";
import "@/models";
import Supplier from "@/models/Supplier";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = supplierSchema.partial().parse(await request.json());
    await connectDB();
    const supplier = await (await tenantModel(Supplier)).findByIdAndUpdate(
      id,
      {
        ...data,
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.countryCode ? { countryCode: data.countryCode.toUpperCase() } : {}),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!supplier) return fail("Supplier not found", 404);
    return ok(supplier);
  } catch (err) {
    return handleError(err);
  }
}
