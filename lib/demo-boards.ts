import type { Board } from "./board-types";
export type { Board, Subtask } from "./board-types";

export const demoBoards: Board[] = [
  {
    id: "exams", title: "Semana de exámenes finales", accent: "violet",
    tasks: [
      { id: "schedule", title: "Organizar el calendario", completed: true },
      { id: "math", title: "Repasar matemáticas", completed: false },
      { id: "practice", title: "Resolver exámenes anteriores", completed: false },
      { id: "history", title: "Preparar resumen de historia", completed: false },
    ],
  },
  {
    id: "shopping", title: "Compras", accent: "slate",
    tasks: [
      { id: "fruit", title: "Frutas y verduras", completed: true },
      { id: "coffee", title: "Café para la semana", completed: true },
      { id: "notebook", title: "Cuaderno de apuntes", completed: false },
    ],
  },
  {
    id: "project", title: "Proyecto personal", accent: "sand",
    tasks: [
      { id: "scope", title: "Definir la primera versión", completed: true },
      { id: "design", title: "Diseñar la pantalla principal", completed: false },
      { id: "share", title: "Compartir un primer avance", completed: false },
    ],
  },
];
