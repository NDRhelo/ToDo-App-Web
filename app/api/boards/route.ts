import { handle, body } from "@/lib/server/api";
import { listBoards, createBoard } from "@/lib/server/boards";

export const GET = (request: Request) => handle(request, async (db, userId) => Response.json(await listBoards(db, userId)));
export const POST = (request: Request) => handle(request, async (db) => {
  const input = await body(request, "title");
  return Response.json(await createBoard(db, input.title as string), { status: 201 });
});
