import type { Subtask } from "@/lib/board-types";
import { TaskDeleteButton } from "./task-delete-button";
import styles from "./workspace.module.css";

export function BoardTaskList({ tasks, pending, onToggle, onDeleteTask }: {
  tasks: Subtask[]; pending: string | null;
  onToggle: (id: string) => Promise<boolean>; onDeleteTask: (id: string) => Promise<boolean>;
}) {
  return tasks.length ? <ul className={styles.tasks}>{tasks.map((task) =>
    <li key={task.id} className={styles.boardTaskRow}>
      <label className={styles.task}><input type="checkbox" disabled={pending !== null}
        aria-busy={pending === `toggle:${task.id}`} checked={task.completed} onChange={() => onToggle(task.id)} />
        <span>{task.title}</span></label>
      <TaskDeleteButton title={task.title} busy={pending !== null} deleting={pending === `delete-task:${task.id}`} onDelete={() => onDeleteTask(task.id)} />
    </li>)}</ul> : <p className={styles.empty}>Todo empieza con un primer paso. Agrega una tarea.</p>;
}
