"use client";

import { useEffect, useRef, useState } from "react";
import type { Board } from "@/lib/board-types";
import * as api from "@/lib/boards";

export function useBoards(userId: string) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const alive = useRef(false);
  const locked = useRef(false);

  // Workspace is keyed by userId: account changes discard the entire state.
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    api.listBoards(userId).then((data) => {
      if (!cancelled) setBoards(data);
    }).catch(() => {
      if (!cancelled) setLoadError("No pudimos cargar tus tableros. Revisa tu conexión e inténtalo de nuevo.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; alive.current = false; };
  }, [userId, revision]);

  async function run<T>(key: string, message: string, request: () => Promise<T>, apply: (result: T, current: Board[]) => Board[]) {
    if (locked.current || loading || loadError) return false;
    locked.current = true;
    setPending(key);
    setOperationError("");
    try {
      const result = await request();
      if (!alive.current) return false;
      setBoards((current) => apply(result, current));
      return true;
    } catch {
      if (alive.current) setOperationError(`${message} Revisa tu conexión y permisos antes de reintentar. Si perdiste la conexión durante el guardado, recarga para comprobar si llegó a guardarse.`);
      return false;
    } finally {
      locked.current = false;
      if (alive.current) setPending(null);
    }
  }

  return {
    boards, loading, loadError, operationError, pending,
    retry: () => { setLoading(true); setLoadError(""); setRevision((value) => value + 1); },
    create: (title: string) => run("create", "No se pudo crear el tablero.", () => api.createBoard(title), (board, current) => [...current, board]),
    rename: (id: string, title: string) => run(`rename:${id}`, "No se pudo cambiar el nombre.", () => api.renameBoard(id, title), (saved, current) => current.map((board) => board.id === id ? { ...board, ...saved } : board)),
    remove: (id: string) => run(`delete:${id}`, "No se pudo eliminar el tablero.", () => api.deleteBoard(id), (_, current) => current.filter((board) => board.id !== id)),
    addTask: (id: string, title: string) => run(`add:${id}`, "No se pudo agregar la subtarea.", () => api.createSubtask(id, title), (task, current) => current.map((board) => board.id === id ? { ...board, tasks: [...board.tasks, task] } : board)),
    removeTask: (boardId: string, taskId: string) => run(`delete-task:${taskId}`, "No se pudo eliminar la tarea.",
      () => api.deleteSubtask(boardId, taskId),
      (_, current) => current.map((board) => board.id === boardId ? { ...board, tasks: board.tasks.filter((task) => task.id !== taskId) } : board)),
    toggle: (boardId: string, taskId: string) => {
      const task = boards.find((board) => board.id === boardId)?.tasks.find((task) => task.id === taskId);
      if (!task) return Promise.resolve(false);
      return run(`toggle:${taskId}`, "No se pudo actualizar la subtarea.", () => api.setSubtaskCompleted(taskId, !task.completed), (saved, current) => current.map((board) => board.id === boardId ? { ...board, tasks: board.tasks.map((task) => task.id === taskId ? saved : task) } : board));
    },
  };
}
