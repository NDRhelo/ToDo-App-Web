// Stable across reloads and renames, including boards created with the default accent.
export function boardColor(id: string) {
  const colors = ["#c4b5fd", "#7dd3fc", "#6ee7b7", "#fcd34d", "#fda4af", "#d8b4fe"];
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length];
}
