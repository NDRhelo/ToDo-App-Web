import { handle, body, id } from "@/lib/server/api";
import { renameBoard, deleteBoard } from "@/lib/server/boards";

type Context = { params: Promise<{ boardId: string }> };
export const PATCH = (request: Request, context: Context) => handle(request, async (db) => {
  const boardId = id((await context.params).boardId);
  const input = await body(request, "title");
  return Response.json(await renameBoard(db, boardId, input.title as string));
});
export const DELETE = (request: Request, context: Context) => handle(request, async (db) => {
  await deleteBoard(db, id((await context.params).boardId));
  return new Response(null, { status: 204 });
});
