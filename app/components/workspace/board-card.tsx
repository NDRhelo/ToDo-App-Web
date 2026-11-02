import type { CSSProperties } from "react";
import { TaskDeleteButton } from "./task-delete-button";
import type { Board } from "@/lib/board-types";
import { BoardActions } from "./board-actions";
import { InlineCreateForm } from "./inline-create-form";
import styles from "./workspace.module.css";

export function BoardCard({ board, color, onToggle, onAddTask, onRename, onDelete, onDeleteTask, pending }: {
  color: string; onDeleteTask: (taskId: string) => Promise<boolean>; board: Board; pending: string | null; onRename: (title: string) => Promise<boolean>; onDelete: () => Promise<boolean>; onToggle: (taskId: string) => Promise<boolean>; onAddTask: (title: string) => Promise<boolean>;
}) {
  const completed = board.tasks.filter((task) => task.completed).length;
  const percent = board.tasks.length ? Math.round(completed / board.tasks.length * 100) : 0;
  return <article className={`${styles.board} ${board.accent === "violet" ? "" : styles[board.accent]}`} style={{ "--board-accent": color } as CSSProperties} aria-label={board.title}>
    <BoardActions busy={pending !== null} board={board} onRename={onRename} onDelete={onDelete} />
    <div className={styles.boardTitle}><span aria-hidden="true" className={styles.boardIcon}>▢</span><h2>{board.title}</h2></div>
    <div className={styles.progressLabel}><span>{completed} de {board.tasks.length} completadas</span><span>{percent}%</span></div>
    <div className={styles.track} role="progressbar" aria-label={`Progreso de ${board.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className={styles.fill} style={{ width: `${percent}%` }} /></div>
    {board.tasks.length ? <ul className={styles.tasks}>{board.tasks.map((task) => <li key={task.id} className={styles.boardTaskRow}><label className={styles.task}><input type="checkbox" disabled={pending !== null} aria-busy={pending === `toggle:${task.id}`} checked={task.completed} onChange={() => onToggle(task.id)} /><span>{task.title}</span></label><TaskDeleteButton title={task.title} busy={pending !== null} deleting={pending === `delete-task:${task.id}`} onDelete={() => onDeleteTask(task.id)} /></li>)}</ul> : <p className={styles.empty}>Todo empieza con un primer paso. Agrega una tarea.</p>}
    <InlineCreateForm kind="task" label="Nueva tarea" placeholder="¿Cuál es el siguiente paso?" submitLabel="Agregar" maxLength={160} onCreate={onAddTask} />
  </article>;
}
