import { handle, id } from "@/lib/server/api";
import { deleteSubtask } from "@/lib/server/boards";

export const DELETE = (request: Request, context: { params: Promise<{ boardId: string; taskId: string }> }) => handle(request, async (db) => {
  const params = await context.params;
  await deleteSubtask(db, id(params.boardId), id(params.taskId));
  return new Response(null, { status: 204 });
});
