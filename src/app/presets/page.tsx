import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPresets } from "@/domain/presets/service";
import { CreatePresetForm } from "@/components/editor/CreatePresetForm";
import styles from "./presets.module.css";

const kindLabel = {
  territory: "Территории",
  dispanserization: "Диспансеризация",
} as const;

export default async function PresetsPage() {
  const user = await requireUser();
  const rows = await listPresets(user);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>dashboard.tfoms</p>
          <h1>Пресеты</h1>
        </div>
        <div className={styles.actions}>
          <span className={styles.user}>
            {user.fullName} · {user.role}
          </span>
          <form action="/api/auth/logout" method="post">
            <button className={styles.ghost}>Выйти</button>
          </form>
        </div>
      </header>

      {user.role !== "viewer" && <CreatePresetForm />}

      <section className={styles.list} aria-label="Список пресетов">
        {rows.length === 0 ? (
          <p className={styles.empty}>Пока нет сохранённых макетов</p>
        ) : (
          rows.map((row) => (
            <Link
              key={row.id}
              href={`/editor/${row.id}`}
              className={styles.card}
            >
              <strong>{row.name}</strong>
              <span>{kindLabel[row.kind]}</span>
              <span>v{row.version}</span>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
