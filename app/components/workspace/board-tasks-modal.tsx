import { useEffect, useId, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Board } from "@/lib/board-types";
import { BoardTaskList } from "./board-task-list";
import { InlineCreateForm } from "./inline-create-form";
import styles from "./workspace.module.css";

export function BoardTasksModal({ board, color, pending, operationError, onClose, onToggle, onDeleteTask, onAddTask }: {
  board: Board; color: string; pending: string | null; operationError: string; onClose: () => void;
  onToggle: (id: string) => Promise<boolean>; onDeleteTask: (id: string) => Promise<boolean>;
  onAddTask: (title: string) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const heading = useId();
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const card = previousFocus?.closest("article");
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else card?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    };
  }, []);
  const completed = board.tasks.filter((task) => task.completed).length;
  const percent = board.tasks.length ? Math.round(completed / board.tasks.length * 100) : 0;
  return createPortal(<div className={`${styles.workspace} ${styles.modalRoot}`}>
    <dialog ref={dialog} className={styles.taskModal} style={{ "--board-accent": color } as CSSProperties}
      aria-labelledby={heading} onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={onClose}>
      <div className={styles.modalHeader}>
        <div><p className={styles.eyebrow}>Todas las tareas del tablero</p><h2 id={heading}>{board.title}</h2></div>
        <button ref={closeButton} type="button" className={styles.secondary} onClick={onClose}>Cerrar</button>
      </div>
      <div className={styles.progressLabel}><span>{completed} de {board.tasks.length} completadas</span><span>{percent}%</span></div>
      <div className={styles.track} role="progressbar" aria-label={`Progreso de ${board.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className={styles.fill} style={{ width: `${percent}%` }} /></div>
      {operationError && <p role="alert" className={styles.dangerText}>{operationError}</p>}
      <BoardTaskList tasks={board.tasks} pending={pending} onToggle={onToggle} onDeleteTask={async (id) => {
        const success = await onDeleteTask(id);
        if (success) closeButton.current?.focus();
        return success;
      }} />
      <fieldset disabled={pending !== null} className="min-w-0">
        <InlineCreateForm kind="task" label="Nueva tarea" placeholder="¿Cuál es el siguiente paso?" submitLabel="Agregar" maxLength={160} onCreate={onAddTask} />
      </fieldset>
    </dialog>
  </div>, document.body);
}
