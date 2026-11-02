import { useState, type CSSProperties } from "react";
import { BoardTaskList } from "./board-task-list";
import { BoardTasksModal } from "./board-tasks-modal";
import type { Board } from "@/lib/board-types";
import { BoardActions } from "./board-actions";
import { InlineCreateForm } from "./inline-create-form";
import styles from "./workspace.module.css";

export function BoardCard({ board, color, onToggle, onAddTask, onRename, onDelete, onDeleteTask, operationError, pending }: {
  operationError: string; color: string; onDeleteTask: (taskId: string) => Promise<boolean>; board: Board; pending: string | null; onRename: (title: string) => Promise<boolean>; onDelete: () => Promise<boolean>; onToggle: (taskId: string) => Promise<boolean>; onAddTask: (title: string) => Promise<boolean>;
}) {
  const [expanded, setExpanded] = useState(false);
  function closeModal() { setExpanded(false); }
  const completed = board.tasks.filter((task) => task.completed).length;
  const percent = board.tasks.length ? Math.round(completed / board.tasks.length * 100) : 0;
  return <article className={`${styles.board} ${board.accent === "violet" ? "" : styles[board.accent]}`} style={{ "--board-accent": color } as CSSProperties} aria-label={board.title}>
    <BoardActions busy={pending !== null} board={board} onRename={onRename} onDelete={onDelete} />
    <div className={styles.boardTitle}><span aria-hidden="true" className={styles.boardIcon}>▢</span><h2>{board.title}</h2></div>
    <div className={styles.progressLabel}><span>{completed} de {board.tasks.length} completadas</span><span>{percent}%</span></div>
    <div className={styles.track} role="progressbar" aria-label={`Progreso de ${board.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className={styles.fill} style={{ width: `${percent}%` }} /></div>
    <BoardTaskList tasks={board.tasks.slice(0, 4)} pending={pending} onToggle={onToggle} onDeleteTask={onDeleteTask} />
    {(board.tasks.length > 4 || expanded) && <button type="button" className={styles.viewAllTasks} aria-haspopup="dialog" onClick={() => setExpanded(true)}>Ver todas las tareas ({board.tasks.length})</button>}
    {expanded && <BoardTasksModal board={board} color={color} pending={pending} operationError={operationError} onClose={closeModal} onToggle={onToggle} onDeleteTask={onDeleteTask} onAddTask={onAddTask} />}

    <InlineCreateForm kind="task" label="Nueva tarea" placeholder="¿Cuál es el siguiente paso?" submitLabel="Agregar" maxLength={160} onCreate={onAddTask} />
  </article>;
}
