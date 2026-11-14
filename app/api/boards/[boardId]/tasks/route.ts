import { handle, body, id } from "@/lib/server/api";
import { createSubtask } from "@/lib/server/boards";

export const POST = (request: Request, context: { params: Promise<{ boardId: string }> }) => handle(request, async (db) => {
  const boardId = id((await context.params).boardId);
  const input = await body(request, "title", 160);
  return Response.json(await createSubtask(db, boardId, input.title as string), { status: 201 });
});
