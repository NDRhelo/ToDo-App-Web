import { describe, expect, it } from "vitest";
import { boardColors } from "@/lib/board-color";

describe("Colores de tableros", () => {
  it("evita colisiones entre los primeros diez y mantiene la asignación al agregar otro", () => {
    const boards = Array.from({ length: 10 }, (_, i) => ({ id: `board-${i * 10}` }));
    const initial = boardColors(boards);
    expect(new Set(initial.values()).size).toBe(10);
    const expanded = boardColors([...boards, { id: "new" }]);
    for (const board of boards) expect(expanded.get(board.id)).toBe(initial.get(board.id));
    expect(expanded.get("new")).toBeDefined();
  });
  it("es determinista al recargar o renombrar y admite cuentas vacías", () => {
    const boards = [{ id: "a", title: "Viaje" }, { id: "k", title: "Casa" }];
    expect(boardColors(boards)).toEqual(boardColors(boards.map((board) => ({ ...board, title: "Otro" }))));
    expect(boardColors([]).size).toBe(0);
  });
});
