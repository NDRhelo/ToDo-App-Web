import { beforeEach, expect, it, vi } from "vitest";
import { listBoards, createBoard, deleteSubtask } from "@/lib/boards";
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: "token" } }, error: null });
});
it("consulta la API propia con token sin enviar el propietario del navegador", async () => {
  mocks.fetch.mockResolvedValue(Response.json([]));
  await listBoards("untrusted-id");
  expect(mocks.fetch).toHaveBeenCalledWith("/api/boards", expect.objectContaining({ headers: { Authorization: "Bearer token" }, cache: "no-store" }));
});
it("envía títulos y reconoce borrados 204", async () => {
  mocks.fetch.mockResolvedValueOnce(Response.json({ id: "b", tasks: [] })).mockResolvedValueOnce(new Response(null, { status: 204 }));
  await createBoard("Viaje");
  expect(mocks.fetch.mock.calls[0][1].body).toBe(JSON.stringify({ title: "Viaje" }));
  await expect(deleteSubtask("b", "s")).resolves.toBeUndefined();
});
it("propaga errores de API y evita solicitudes sin sesión", async () => {
  mocks.fetch.mockResolvedValue(Response.json({ error: "Sesión inválida" }, { status: 401 }));
  await expect(listBoards("u")).rejects.toThrow("Sesión inválida");
  mocks.fetch.mockClear();
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  await expect(listBoards("u")).rejects.toThrow("Inicia sesión");
  expect(mocks.fetch).not.toHaveBeenCalled();
});
