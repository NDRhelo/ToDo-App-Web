export type Subtask = { id: string; title: string; completed: boolean };
export type Board = {
  id: string;
  title: string;
  accent: "violet" | "slate" | "sand";
  tasks: Subtask[];
};
