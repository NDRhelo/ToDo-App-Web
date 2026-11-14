import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function authenticate(request: Request) {
  const match = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i);
  if (!match) throw new ApiError(401, "Inicia sesión para continuar.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ApiError(500, "El servidor no está configurado.");
  // A fresh client per request prevents sharing sessions between users. RLS stays active.
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await db.auth.getUser(match[1]);
  if (error || !data.user) throw new ApiError(401, "La sesión no es válida. Inicia sesión nuevamente.");
  return { db, userId: data.user.id };
}

type Operation = (db: SupabaseClient, userId: string) => Promise<Response>;
export async function handle(request: Request, operation: Operation): Promise<Response> {
  try {
    const { db, userId } = await authenticate(request);
    const response = await operation(db, userId);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    let status = 500;
    let message = "No se pudo completar la operación. Inténtalo nuevamente.";
    if (error instanceof ApiError) { status = error.status; message = error.message; }
    else if (error && typeof error === "object" && "code" in error) {
      if (error.code === "PGRST116") { status = 404; message = "El recurso no existe o no tienes acceso."; }
      else if (error.code === "42501") { status = 403; message = "No tienes permiso para esta operación."; }
      else if (error.code === "23503") { status = 404; message = "El tablero no existe o no tienes acceso."; }
      else if (error.code === "23514" || error.code === "22P02") { status = 400; message = "Los datos enviados no son válidos."; }
    }
    return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}

export function id(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new ApiError(400, "Identificador inválido.");
  return value;
}
export async function body(request: Request, field: "title" | "completed", maxLength = 100) {
  let value: unknown;
  try { value = await request.json(); } catch { throw new ApiError(400, "Envía un cuerpo JSON válido."); }
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1 || !(field in value)) throw new ApiError(400, "Los campos enviados no son válidos.");
  const result = value as Record<string, unknown>;
  if (field === "completed") {
    if (typeof result.completed !== "boolean") throw new ApiError(400, "El estado debe ser booleano.");
  } else {
    if (typeof result.title !== "string" || !result.title.trim() || result.title.length > maxLength) throw new ApiError(400, `El título debe tener entre 1 y ${maxLength} caracteres.`);
    result.title = result.title.trim();
  }
  return result;
}
