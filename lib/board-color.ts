const colors = ["#c4b5fd", "#7dd3fc", "#6ee7b7", "#fcd34d", "#fda4af", "#f0abfc", "#fdba74", "#a3e635", "#5eead4", "#a5b4fc"];

// Assign against the complete board list, before applying task filters.
// Resolve collisions so every group of ten boards gets ten different colors.
export function boardColors(boards: readonly { id: string }[]): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set<number>();
  for (const board of boards) {
    if (used.size === colors.length) used.clear();
    let hash = 0;
    for (const character of board.id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    let index = hash % colors.length;
    while (used.has(index)) index = (index + 1) % colors.length;
    used.add(index);
    result.set(board.id, colors[index]);
  }
  return result;
}
