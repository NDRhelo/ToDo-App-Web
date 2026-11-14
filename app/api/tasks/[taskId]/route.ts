import { handle, body, id } from "@/lib/server/api";
import { setSubtaskCompleted } from "@/lib/server/boards";

export const PATCH = (request: Request, context: { params: Promise<{ taskId: string }> }) => handle(request, async (db) => {
  const taskId = id((await context.params).taskId);
  const input = await body(request, "completed");
  return Response.json(await setSubtaskCompleted(db, taskId, input.completed as boolean));
});
