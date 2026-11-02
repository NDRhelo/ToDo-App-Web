import { useRef, useState } from "react";
import styles from "./workspace.module.css";

export function TaskDeleteButton({ title, busy, deleting, onDelete }: {
  title: string; busy: boolean; deleting: boolean; onDelete: () => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  function cancel() { setConfirming(false); trigger.current?.focus(); }
  return <div className={styles.taskDelete}>
    <button ref={trigger} type="button" className={styles.deleteTaskButton} disabled={busy}
      aria-label={`Eliminar tarea: ${title}`} aria-expanded={confirming} onClick={() => setConfirming(true)}>Eliminar</button>
    {confirming && <div role="group" aria-label={`¿Eliminar tarea «${title}»?`} className={styles.taskConfirmation}
      onKeyDown={(event) => { if (event.key === "Escape" && !busy) cancel(); }}>
      <p>¿Eliminar «{title}»? Esta acción no se puede deshacer.</p>
      <div className={styles.actions}>
        <button autoFocus type="button" disabled={busy} className={styles.secondary} onClick={cancel}>Cancelar</button>
        <button type="button" disabled={busy} className={`${styles.secondary} ${styles.dangerButton}`}
          onClick={async () => { await onDelete(); }}>{deleting ? "Eliminando…" : "Confirmar eliminación de tarea"}</button>
      </div>
    </div>}
  </div>;
}
