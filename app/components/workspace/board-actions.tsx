import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Board } from "@/lib/board-types";
import styles from "./workspace.module.css";

export function BoardActions({ board, onRename, onDelete, busy }: {
  board: Board; busy: boolean; onRename: (title: string) => Promise<boolean>; onDelete: () => Promise<boolean>;
}) {
  const [action, setAction] = useState<"rename" | "delete" | null>(null);
  const [title, setTitle] = useState(board.title);
  const [error, setError] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const id = useId();

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (details.current && !details.current.contains(event.target as Node)) details.current.open = false;
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  function close() {
    if (busy) return;
    setAction(null);
    if (details.current) details.current.open = false;
    trigger.current?.focus();
  }
  function choose(next: "rename" | "delete") {
    if (details.current) details.current.open = false;
    setError("");
    setTitle(board.title);
    if (next === "delete" && board.tasks.length === 0) void onDelete();
    else setAction(next);
  }
  async function rename(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim()) { setError("Escribe un nombre para el tablero."); return; }
    if (await onRename(title.trim())) {
      setAction(null);
      trigger.current?.focus();
    }
  }

  return <div className={styles.boardActions} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
    <details ref={details} className={styles.actionDisclosure}>
      <summary ref={trigger} aria-label={`Opciones de ${board.title}`} className={styles.moreButton}><span aria-hidden="true">⋯</span></summary>
      <div className={styles.actionList}>
        <button disabled={busy} type="button" onClick={() => choose("rename")}>Cambiar nombre</button>
        <button disabled={busy} type="button" className={styles.dangerText} onClick={() => choose("delete")}>Eliminar tablero</button>
      </div>
    </details>
    {action === "rename" && <form className={styles.actionPanel} onSubmit={rename}>
      <label htmlFor={id}>Nombre del tablero</label>
      <input disabled={busy} autoFocus id={id} className={styles.input} value={title} maxLength={100} onChange={(event) => { setTitle(event.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
      {error && <p id={`${id}-error`} role="alert" className={styles.dangerText}>{error}</p>}
      <div className={styles.actions}><button disabled={busy} type="submit" className={styles.primary}>{busy ? "Guardando…" : "Guardar nombre"}</button><button disabled={busy} type="button" className={styles.secondary} onClick={close}>Cancelar</button></div>
    </form>}
    {action === "delete" && <section className={styles.actionPanel} role="group" aria-labelledby={`${id}-delete`}>
      <p id={`${id}-delete`}>¿Eliminar «{board.title}»?</p>
      <p className={styles.subtitle}>Se eliminarán también sus {board.tasks.length} subtareas del tablero.</p>
      <div className={styles.actions}><button disabled={busy} autoFocus type="button" className={styles.secondary} onClick={close}>Cancelar</button><button disabled={busy} type="button" className={`${styles.secondary} ${styles.dangerButton}`} onClick={() => void onDelete()}>{busy ? "Eliminando…" : "Confirmar eliminación"}</button></div>
    </section>}
  </div>;
}
