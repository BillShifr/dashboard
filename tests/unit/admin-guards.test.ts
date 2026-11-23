import { describe, expect, it } from "vitest";
import { blockedAdminChange } from "@/domain/admin/guards";

const admin = {
  id: "admin-1",
  role: "admin" as const,
  isActive: true,
};

describe("blockedAdminChange", () => {
  it("stops the actor from disabling their own account", () => {
    expect(
      blockedAdminChange({
        actorId: admin.id,
        target: admin,
        next: { role: "admin", isActive: false },
        activeAdminCount: 2,
      }),
    ).toBe("SELF_DEACTIVATE");
  });

  it("keeps the last active administrator", () => {
    expect(
      blockedAdminChange({
        actorId: "admin-2",
        target: admin,
        next: { role: "editor", isActive: true },
        activeAdminCount: 1,
      }),
    ).toBe("LAST_ADMIN");
  });

  it("allows demotion when another administrator remains", () => {
    expect(
      blockedAdminChange({
        actorId: "admin-2",
        target: admin,
        next: { role: "editor", isActive: true },
        activeAdminCount: 2,
      }),
    ).toBeNull();
  });

  it("allows disabling an editor", () => {
    expect(
      blockedAdminChange({
        actorId: admin.id,
        target: { id: "editor-1", role: "editor", isActive: true },
        next: { role: "editor", isActive: false },
        activeAdminCount: 1,
      }),
    ).toBeNull();
  });
});
