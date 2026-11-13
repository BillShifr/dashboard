import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPreset } from "@/domain/presets/service";
import { EditorShell } from "@/components/editor/EditorShell";
import styles from "./editor.module.css";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const preset = await getPreset(user, id);
  if (!preset) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/presets" className={styles.back}>
            ← Пресеты
          </Link>
          <h1>{preset.name}</h1>
          <p>
            {preset.kind === "territory" ? "Территории" : "Диспансеризация"} · v
            {preset.version}
          </p>
        </div>
      </header>
      <EditorShell
        presetId={preset.id}
        kind={preset.kind}
        version={preset.version}
        payload={preset.payload}
        readOnly={user.role === "viewer"}
      />
    </main>
  );
}
