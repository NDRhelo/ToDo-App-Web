import { useRef, useState, type CSSProperties } from "react";
import type { Board } from "@/lib/board-types";
import { boardColor } from "@/lib/board-color";
import { TaskDeleteButton } from "./task-delete-button";
import styles from "./workspace.module.css";

type Filter = "pending" | "completed" | "all";

export function TasksView({ boards, loading, loadError, operationError, pending, onRetry, onOpenBoards, onToggle, onDeleteTask }: {
  boards: Board[]; loading: boolean; loadError: string; operationError: string; pending: string | null;
  onRetry: () => void; onOpenBoards: () => void;
  onToggle: (boardId: string, taskId: string) => Promise<boolean>;
  onDeleteTask: (boardId: string, taskId: string) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [boardId, setBoardId] = useState("");
  const filterRef = useRef<HTMLButtonElement>(null);
  const selectedBoard = boards.some((board) => board.id === boardId) ? boardId : "";
  const tasks = boards.flatMap((board) => board.tasks.map((task) => ({ board, task })));
  const visible = tasks.filter(({ board, task }) =>
    (!selectedBoard || board.id === selectedBoard) &&
    (filter === "all" || task.completed === (filter === "completed")));
  async function toggle(id: string, taskId: string) {
    const success = await onToggle(id, taskId);
    if (success && filter !== "all") filterRef.current?.focus();
  }
  return <div>
    <div className={styles.toolbar}>
      <div><p className={styles.eyebrow}>Un paso a la vez</p><h1 className={styles.heading}>Mis tareas</h1>
        <p className={styles.subtitle}>Elige tu siguiente paso. Cada tarea conserva su tablero.</p></div>
      <button type="button" className={styles.secondary} onClick={onOpenBoards}>Ir a mis tableros</button>
    </div>
    {loading && <p role="status" className={styles.subtitle}>Cargando tus tareas…</p>}
    {loadError && <div role="alert"><p>{loadError}</p><button type="button" className={styles.secondary} onClick={onRetry}>Reintentar</button></div>}
    {operationError && <p role="alert" className={styles.dangerText}>{operationError}</p>}
    {!loading && !loadError && <>
      <div className={styles.taskFilters}>
        <div role="group" aria-label="Filtrar por estado" className={styles.filterTabs}>
          {([["pending", "Pendientes"], ["completed", "Completadas"], ["all", "Todas"]] as const).map(([value, label]) =>
            <button ref={filter === value ? filterRef : undefined} key={value} type="button" aria-pressed={filter === value}
              onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <label className={styles.boardFilter}>Tablero
          <select value={selectedBoard} onChange={(event) => setBoardId(event.target.value)}>
            <option value="">Todos los tableros</option>
            {boards.map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}
          </select>
        </label>
      </div>
      <p role="status" className={styles.resultCount}>{visible.length} {visible.length === 1 ? "tarea" : "tareas"}</p>
      {tasks.length === 0 ? <p className={styles.empty}>
        {boards.length === 0 ? "Crea tu primer tablero y agrega tus tareas dentro de él." : "Todavía no tienes tareas. Abre uno de tus tableros para agregar la primera."}
      </p> : visible.length === 0 ? <p className={styles.empty}>No hay tareas con estos filtros.</p> :
        <ul className={styles.taskList} aria-label="Lista de tareas">
          {visible.map(({ board, task }) => <li key={task.id} className={styles.taskListRow}
            style={{ "--board-accent": boardColor(board.id) } as CSSProperties}>
            <label className={styles.task}>
              <input type="checkbox" checked={task.completed} disabled={pending !== null}
                aria-busy={pending === `toggle:${task.id}`} onChange={() => toggle(board.id, task.id)} />
              <span>{task.title}</span>
            </label>
            <span className={styles.boardTag}><span aria-hidden="true" className={styles.boardDot} />{board.title}</span>
            <TaskDeleteButton title={task.title} busy={pending !== null} deleting={pending === `delete-task:${task.id}`}
              onDelete={async () => { const success = await onDeleteTask(board.id, task.id); if (success) filterRef.current?.focus(); return success; }} />
          </li>)}
        </ul>}
    </>}
  </div>;
}
