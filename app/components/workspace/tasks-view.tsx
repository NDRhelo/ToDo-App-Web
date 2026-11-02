import type { Board } from "@/lib/board-types";
import styles from "./workspace.module.css";

export function TasksView({ boards, loading, loadError, operationError, pending, onRetry, onOpenBoards, onToggle }: {
  boards: Board[]; loading: boolean; loadError: string; operationError: string; pending: string | null;
  onRetry: () => void; onOpenBoards: () => void;
  onToggle: (boardId: string, taskId: string) => Promise<boolean>;
}) {
  const groups = boards.filter((board) => board.tasks.length > 0);
  return <div>
    <div className={styles.toolbar}>
      <div><p className={styles.eyebrow}>Espacio de trabajo</p><h1 className={styles.heading}>Mis tareas</h1>
        <p className={styles.subtitle}>Todas las tareas de tus tableros, organizadas por tablero.</p></div>
      <button type="button" className={styles.secondary} onClick={onOpenBoards}>Ir a mis tableros</button>
    </div>
    {loading && <p role="status" className={styles.subtitle}>Cargando tus tareas…</p>}
    {loadError && <div role="alert"><p>{loadError}</p><button type="button" className={styles.secondary} onClick={onRetry}>Reintentar</button></div>}
    {operationError && <p role="alert" className={styles.dangerText}>{operationError}</p>}
    {!loading && !loadError && groups.length === 0 && <p className={styles.empty}>
      {boards.length === 0 ? "Crea tu primer tablero y agrega tus tareas dentro de él." : "Todavía no tienes tareas. Abre uno de tus tableros para agregar la primera."}
    </p>}
    {!loading && !loadError && <div className={styles.grid}>{groups.map((board) =>
      <section key={board.id} className={styles.board} aria-label={board.title}>
        <h2 className={styles.boardTitle}>{board.title}</h2>
        <ul className={styles.tasks}>{board.tasks.map((task) => <li key={task.id}>
          <label className={styles.task}>
            <input type="checkbox" checked={task.completed} disabled={pending !== null}
              aria-busy={pending === `toggle:${task.id}`} onChange={() => onToggle(board.id, task.id)} />
            <span>{task.title}</span>
          </label>
        </li>)}</ul>
      </section>
    )}</div>}
  </div>;
}
