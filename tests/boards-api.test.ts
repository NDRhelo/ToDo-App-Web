import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/boards";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { from: mocks.from } }));

function query(data: unknown, error: unknown = null) {
  const result = { data, error };
  const chain = {
    select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result), returns: vi.fn().mockResolvedValue(result),
  };
  mocks.from.mockReturnValue(chain);
  return chain;
}
beforeEach(() => vi.resetAllMocks());

describe("Contrato de persistencia y permisos por columna", () => {
  it("consulta el usuario y ordena tableros y subtareas sin escribir", async () => {
    const q = query([{ id: "b", title: "Compras", accent: "slate", subtasks: [] }]);
    expect(await api.listBoards("user-a")).toEqual([{ id: "b", title: "Compras", accent: "slate", tasks: [] }]);
    expect(q.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(q.order).toHaveBeenCalledWith("created_at", { referencedTable: "subtasks" });
    expect(q.order).toHaveBeenCalledWith("id", { referencedTable: "subtasks" });
    expect(q.insert).not.toHaveBeenCalled();
  });
  it("inserta tableros sin id, propietario ni fecha y devuelve la fila confirmada", async () => {
    const q = query({ id: "server-id", title: "Viaje", accent: "violet" });
    expect(await api.createBoard("Viaje")).toMatchObject({ id: "server-id", tasks: [] });
    expect(q.insert).toHaveBeenCalledExactlyOnceWith({ title: "Viaje", accent: "violet" });
    expect(q.single).toHaveBeenCalled();
  });
  it("inserta subtareas solo con las columnas permitidas", async () => {
    const q = query({ id: "s", title: "Hotel", completed: false });
    await api.createSubtask("b", "Hotel");
    expect(mocks.from).toHaveBeenCalledWith("subtasks");
    expect(q.insert).toHaveBeenCalledExactlyOnceWith({ board_id: "b", title: "Hotel", completed: false });
  });
  it("actualiza exclusivamente el título del tablero", async () => {
    const q = query({ id: "b", title: "Nuevo", accent: "violet" });
    await api.renameBoard("b", "Nuevo");
    expect(q.update).toHaveBeenCalledExactlyOnceWith({ title: "Nuevo" });
    expect(q.eq).toHaveBeenCalledWith("id", "b");
  });
  it.each([true, false])("guarda completed=%s sin enviar datos inmutables", async (completed) => {
    const q = query({ id: "s", title: "Hotel", completed });
    await api.setSubtaskCompleted("s", completed);
    expect(q.update).toHaveBeenCalledExactlyOnceWith({ completed });
    expect(q.eq).toHaveBeenCalledWith("id", "s");
  });
  it("elimina solo el tablero y comprueba la fila devuelta; la cascada corresponde a SQL", async () => {
    const q = query({ id: "b" });
    await api.deleteBoard("b");
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("boards");
    expect(q.delete).toHaveBeenCalledTimes(1);
    expect(q.select).toHaveBeenCalledWith("id");
    expect(q.single).toHaveBeenCalled();
  });
  it("elimina una tarea únicamente dentro de su tablero y exige confirmación", async () => {
    const q = query({ id: "s" });
    await api.deleteSubtask("b", "s");
    expect(mocks.from).toHaveBeenCalledWith("subtasks");
    expect(q.eq).toHaveBeenCalledWith("id", "s");
    expect(q.eq).toHaveBeenCalledWith("board_id", "b");
    query(null);
    await expect(api.deleteSubtask("b", "s")).rejects.toThrow(/no existe/);
    query(null, new Error("RLS denied"));
    await expect(api.deleteSubtask("foreign", "s")).rejects.toThrow("RLS denied");
  });
  it("no considera exitosa una operación sin filas o con error RLS", async () => {
    query(null);
    await expect(api.deleteBoard("missing")).rejects.toThrow(/no existe/);
    query(null, new Error("RLS denied"));
    await expect(api.createSubtask("foreign", "No permitido")).rejects.toThrow("RLS denied");
    await expect(api.renameBoard("foreign", "No permitido")).rejects.toThrow("RLS denied");
  });
});
