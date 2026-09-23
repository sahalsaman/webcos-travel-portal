import { ActivityInventoryManager } from "@/components/admin/activity-inventory-manager";
import { listAdminActivities, listAdminActivityTypes } from "@/lib/dashboard";
import type { ActivityDTO, ActivityTypeDTO } from "@/types";

export default async function ActivitiesInventoryPage() {
  const [activities, types] = await Promise.all([listAdminActivities(), listAdminActivityTypes()]);
  return <ActivityInventoryManager activities={activities as ActivityDTO[]} types={types as ActivityTypeDTO[]} />;
}
