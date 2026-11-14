import { supabase } from "./supabase";
import type { Board, Subtask } from "./board-types";

async function request<T>(path: string, method = "GET", body?: object): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Inicia sesión para continuar.");
  const response = await fetch(`/api${path}`, {
    method,
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "No se pudo completar la solicitud.");
  return result as T;
}

// The server derives ownership from the verified token, never from this UI identifier.
export function listBoards(userId: string): Promise<Board[]> {
  void userId;
  return request("/boards");
}
export const createBoard = (title: string) => request<Board>("/boards", "POST", { title });
export const renameBoard = (id: string, title: string) => request<Omit<Board, "tasks">>(`/boards/${encodeURIComponent(id)}`, "PATCH", { title });
export const deleteBoard = (id: string) => request<void>(`/boards/${encodeURIComponent(id)}`, "DELETE");
export const createSubtask = (boardId: string, title: string) => request<Subtask>(`/boards/${encodeURIComponent(boardId)}/tasks`, "POST", { title });
export const setSubtaskCompleted = (id: string, completed: boolean) => request<Subtask>(`/tasks/${encodeURIComponent(id)}`, "PATCH", { completed });
export const deleteSubtask = (boardId: string, id: string) => request<void>(`/boards/${encodeURIComponent(boardId)}/tasks/${encodeURIComponent(id)}`, "DELETE");
