import { ActivityInventoryManager } from "@/components/activity-inventory-manager";
import { listTenantActivities, listTenantActivityTypes } from "@/lib/dashboard";
import type { ActivityDTO, ActivityTypeDTO } from "@/types";

export default async function ActivitiesInventoryPage() {
  const [activities, types] = await Promise.all([listTenantActivities(), listTenantActivityTypes()]);
  return <ActivityInventoryManager activities={activities as ActivityDTO[]} types={types as ActivityTypeDTO[]} />;
}
