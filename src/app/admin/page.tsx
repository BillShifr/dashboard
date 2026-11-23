import { AdminFrame } from "@/components/admin/AdminFrame";
import { AdminSidebarSync } from "@/components/admin/AdminSidebarSync";
import { ReportsPanel } from "@/components/admin/ReportsPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { listPresetDirectory } from "@/domain/presets/service";
import { listDirectory } from "@/domain/users/service";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const user = await requireAdmin();
  const { section } = await searchParams;
  const area = section === "reports" ? "reports" : "users";
  const directory = await listDirectory(user);
  const reports = area === "reports" ? await listPresetDirectory(user) : [];

  return (
    <AdminFrame>
      <AdminSidebarSync section={area} />
      {area === "users" ? (
        <UsersPanel users={directory} actorId={user.id} />
      ) : (
        <ReportsPanel
          owners={directory}
          reports={reports.map((report) => ({
            ...report,
            updatedAt: new Intl.DateTimeFormat("ru-RU", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(report.updatedAt),
          }))}
        />
      )}
    </AdminFrame>
  );
}
