import { useEffect, useRef } from "react";
import { boardColors } from "@/lib/board-color";
import type { Board } from "@/lib/board-types";
import { BoardCard } from "./board-card";
import { InlineCreateForm } from "./inline-create-form";
import styles from "./workspace.module.css";

export function BoardsView({ boards, onDeleteTask, onCreate, onToggle, onAddTask, onRename, onDelete, loading, loadError, operationError, pending, onRetry }: {
  onDeleteTask: (boardId: string, taskId: string) => Promise<boolean>; boards: Board[]; onRename: (boardId: string, title: string) => Promise<boolean>; onDelete: (boardId: string) => Promise<boolean>; onCreate: (title: string) => Promise<boolean>;
  onToggle: (boardId: string, taskId: string) => Promise<boolean>;
  onAddTask: (boardId: string, title: string) => Promise<boolean>;
  loading: boolean; loadError: string; operationError: string; pending: string | null; onRetry: () => void;
}) {
  const colors = boardColors(boards);
  const viewRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!pending && restoreFocus.current) {
      viewRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      restoreFocus.current = false;
    }
  }, [pending, boards]);
  return <div ref={viewRef}>
    {loading && <p role="status" className={styles.subtitle}>Cargando tus tableros…</p>}
    {loadError && <div role="alert"><p>{loadError}</p><button type="button" className={styles.secondary} onClick={onRetry}>Reintentar</button></div>}
    {operationError && <p role="alert" className={`${styles.dangerText} mb-6`}>{operationError}</p>}
    <fieldset disabled={loading || !!loadError || pending !== null} className="min-w-0">
    <div className={styles.toolbar}><div><p className={styles.eyebrow}>Espacio de trabajo</p><h1 className={styles.heading}>Mis tableros</h1><p className={styles.subtitle}>Un lugar para cada cosa que quieres hacer.</p></div><div><InlineCreateForm kind="board" label="Nombre del tablero" placeholder="Por ejemplo, Ideas para el verano" submitLabel="Crear" maxLength={100} onCreate={onCreate} /></div></div>

    {!loading && !loadError && boards.length === 0 && <p className={styles.empty}>Tu espacio está listo. Crea un tablero para empezar.</p>}
    <div className={styles.grid}>{boards.map((board) => <BoardCard color={colors.get(board.id)!} key={board.id} pending={pending} board={board} onDeleteTask={async (taskId) => { const success = await onDeleteTask(board.id, taskId); if (success) restoreFocus.current = true; return success; }} onRename={(title) => onRename(board.id, title)} onDelete={async () => { const success = await onDelete(board.id); if (success) restoreFocus.current = true; return success; }} onToggle={(taskId) => onToggle(board.id, taskId)} onAddTask={(title) => onAddTask(board.id, title)} />)}</div>
    </fieldset>
  </div>;
}
