"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLE_OPTIONS, type RoleId } from "@/components/admin/admin-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AdminUser = {
  id: string;
  login: string;
  fullName: string;
  role: RoleId;
  isActive: boolean;
};

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return data?.error ?? "Не удалось сохранить";
}

export function UsersPanel({
  users,
  actorId,
}: {
  users: AdminUser[];
  actorId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createUser(formData: FormData) {
    setError(null);
    setPending(true);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        login: formData.get("login"),
        role: formData.get("role"),
        password: formData.get("password"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    router.refresh();
  }

  async function saveUser(id: string, formData: FormData) {
    setError(null);
    setPending(true);
    const password = String(formData.get("password") ?? "");
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        login: formData.get("login"),
        role: formData.get("role"),
        isActive: formData.get("isActive") === "on",
        password,
      }),
    });
    setPending(false);
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    if (id === actorId && password.trim()) {
      router.push("/login");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid max-w-6xl gap-8">
      <form
        action={createUser}
        className="grid gap-4 border-b border-border pb-8"
      >
        <h2 className="text-lg font-semibold">Новый пользователь</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <TextField id="new-name" label="Имя" name="fullName" />
          <TextField
            id="new-login"
            label="Логин"
            name="login"
            autoComplete="off"
          />
          <RoleField id="new-role" />
          <TextField
            id="new-password"
            label="Пароль"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            hint="Не короче 12 символов"
          />
        </div>
        <Button disabled={pending} className="w-fit">
          Создать
        </Button>
      </form>

      <div className="grid gap-4">
        <h2 className="text-lg font-semibold">Учётные записи</h2>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пользователей нет.</p>
        ) : (
          users.map((user) => (
            <form
              key={user.id}
              action={(formData) => void saveUser(user.id, formData)}
              className="grid gap-3 border-b border-border pb-4 md:grid-cols-[1fr_1fr_10rem_auto_1fr_auto] md:items-end"
            >
              <TextField
                id={`${user.id}-name`}
                label="Имя"
                name="fullName"
                defaultValue={user.fullName}
              />
              <TextField
                id={`${user.id}-login`}
                label="Логин"
                name="login"
                defaultValue={user.login}
              />
              <RoleField id={`${user.id}-role`} defaultValue={user.role} />
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={user.isActive}
                  disabled={user.id === actorId}
                />
                {user.id === actorId ? (
                  <input type="hidden" name="isActive" value="on" />
                ) : null}
                Действует
              </label>
              <TextField
                id={`${user.id}-password`}
                label="Новый пароль"
                name="password"
                type="password"
                autoComplete="new-password"
                required={false}
                minLength={12}
              />
              <Button type="submit" size="sm" disabled={pending}>
                Сохранить
              </Button>
            </form>
          ))
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  id,
  label,
  name,
  type = "text",
  defaultValue,
  autoComplete,
  required = true,
  minLength,
  hint,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={type === "password" ? 200 : 120}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function RoleField({
  id,
  defaultValue = "editor",
}: {
  id: string;
  defaultValue?: RoleId;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Роль</Label>
      <select
        id={id}
        name="role"
        defaultValue={defaultValue}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
      >
        {ROLE_OPTIONS.map((role) => (
          <option key={role.id} value={role.id}>
            {role.label}
          </option>
        ))}
      </select>
    </div>
  );
}
