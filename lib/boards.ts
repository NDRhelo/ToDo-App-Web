import { supabase } from "./supabase";
import type { Board, Subtask } from "./board-types";

type BoardRecord = Omit<Board, "tasks">;

export async function listBoards(userId: string): Promise<Board[]> {
  const { data, error } = await supabase.from("boards")
    .select("id,title,accent,subtasks(id,title,completed)")
    .eq("user_id", userId)
    .order("created_at").order("id")
    .order("created_at", { referencedTable: "subtasks" })
    .order("id", { referencedTable: "subtasks" })
    .returns<(BoardRecord & { subtasks: Subtask[] })[]>();
  if (error) throw error;
  if (!data) throw new Error("No se recibió una respuesta de tableros.");
  return data.map(({ subtasks, ...board }) => ({ ...board, tasks: subtasks }));
}

export async function createBoard(title: string): Promise<Board> {
  const { data, error } = await supabase.from("boards")
    .insert({ title, accent: "violet" }).select("id,title,accent").single<BoardRecord>();
  if (error) throw error;
  if (!data) throw new Error("No se pudo confirmar la creación del tablero.");
  return { ...data, tasks: [] };
}

export async function renameBoard(id: string, title: string): Promise<BoardRecord> {
  const { data, error } = await supabase.from("boards")
    .update({ title }).eq("id", id).select("id,title,accent").single<BoardRecord>();
  if (error) throw error;
  if (!data) throw new Error("No se pudo confirmar el cambio de nombre.");
  return data;
}

export async function deleteBoard(id: string): Promise<void> {
  const { data, error } = await supabase.from("boards")
    .delete().eq("id", id).select("id").single<{ id: string }>();
  if (error) throw error;
  if (!data) throw new Error("El tablero no existe o no tienes acceso para eliminarlo.");
}

export async function createSubtask(boardId: string, title: string): Promise<Subtask> {
  const { data, error } = await supabase.from("subtasks")
    .insert({ board_id: boardId, title, completed: false })
    .select("id,title,completed").single<Subtask>();
  if (error) throw error;
  if (!data) throw new Error("No se pudo confirmar la creación de la subtarea.");
  return data;
}

export async function setSubtaskCompleted(id: string, completed: boolean): Promise<Subtask> {
  const { data, error } = await supabase.from("subtasks")
    .update({ completed }).eq("id", id).select("id,title,completed").single<Subtask>();
  if (error) throw error;
  if (!data) throw new Error("No se pudo confirmar el estado de la subtarea.");
  return data;
}
