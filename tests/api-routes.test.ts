// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/boards/route";
import { PATCH } from "@/app/api/tasks/[taskId]/route";
import { DELETE } from "@/app/api/boards/[boardId]/route";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
const uuid = "11111111-1111-4111-8111-111111111111";
function req(method = "GET", value?: unknown, token = "token") {
  return new Request("http://localhost/api/boards", { method, headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {}, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
}
function query(data: unknown, error: unknown = null) {
  const chain = { select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data, error }), returns: vi.fn().mockResolvedValue({ data, error }) };
  mocks.from.mockReturnValue(chain);
  return chain;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
  mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser }, from: mocks.from });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-owner" } }, error: null });
});
describe("API autenticada", () => {
  it("rechaza sesiones ausentes o inválidas antes de acceder a tablas", async () => {
    expect((await GET(req("GET", undefined, ""))).status).toBe(401);
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    expect((await GET(req())).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("usa el propietario verificado y propaga el token a RLS sin cachear datos", async () => {
    const q = query([]);
    const response = await GET(req());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(q.eq).toHaveBeenCalledWith("user_id", "verified-owner");
    expect(mocks.getUser).toHaveBeenCalledWith("token");
    expect(mocks.createClient.mock.calls[0][2].global.headers.Authorization).toBe("Bearer token");
  });
  it.each([{ title: " " }, { title: "x".repeat(101) }, { title: "Hola", user_id: "foreign" }, null])("rechaza títulos y campos inválidos: %j", async (input) => {
    expect((await POST(req("POST", input))).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("crea el tablero con título normalizado", async () => {
    const q = query({ id: uuid, title: "Viaje", accent: "violet" });
    const response = await POST(req("POST", { title: " Viaje " }));
    expect(response.status).toBe(201);
    expect(q.insert).toHaveBeenCalledWith({ title: "Viaje", accent: "violet" });
    expect(await response.json()).toMatchObject({ tasks: [] });
  });
  it("rechaza JSON malformado, identificadores y estados inválidos", async () => {
    const invalid = new Request("http://localhost/api/boards", { method: "POST", headers: { Authorization: "Bearer token" }, body: "{" });
    expect((await POST(invalid)).status).toBe(400);
    expect((await PATCH(req("PATCH", { completed: true }), { params: Promise.resolve({ taskId: "invalid" }) })).status).toBe(400);
    expect((await PATCH(req("PATCH", { completed: "true" }), { params: Promise.resolve({ taskId: uuid }) })).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("devuelve 404 para filas inaccesibles sin revelar errores internos", async () => {
    query(null, { code: "PGRST116", message: "private details" });
    const response = await DELETE(req("DELETE"), { params: Promise.resolve({ boardId: uuid }) });
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("private details");
  });
});
