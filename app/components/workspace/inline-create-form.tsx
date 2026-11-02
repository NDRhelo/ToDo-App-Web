import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import styles from "./workspace.module.css";

export function InlineCreateForm({ label, placeholder, submitLabel, maxLength, kind, onCreate }: {
  label: string; placeholder: string; submitLabel: string; maxLength: number; kind: "board" | "task";
  onCreate: (title: string) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!open && !busy && restoreFocus.current) {
      trigger.current?.focus();
      restoreFocus.current = false;
    }
  }, [open, busy]);
  function close() {
    if (submitting.current) return;
    setOpen(false);
    setTitle("");
    restoreFocus.current = true;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const success = await onCreate(title.trim());
      submitting.current = false;
      if (success) close();
    } finally { submitting.current = false; setBusy(false); }
  }
  const content = <>
    <button ref={trigger} disabled={busy} type="button" className={kind === "board" ? styles.primary : styles.addTask} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <span aria-hidden="true">＋</span>{kind === "board" ? "Crear tablero" : "Agregar tarea"}
    </button>
    {open && <form id={id} aria-busy={busy} onSubmit={submit} className={kind === "board" ? `${styles.form} ${styles.boardCreatePanel}` : styles.form} onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
      <label htmlFor={`${id}-title`}>{label}</label>
      <input disabled={busy} autoFocus id={`${id}-title`} className={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={placeholder} required maxLength={maxLength} />
      <div className={styles.actions}><button disabled={busy} className={styles.primary} type="submit">{busy ? "Guardando…" : submitLabel}</button><button disabled={busy} className={styles.secondary} type="button" onClick={close}>Cancelar</button></div>
    </form>}
  </>;
  return kind === "board" ? <div className={styles.boardCreate}>{content}</div> : content;
}
