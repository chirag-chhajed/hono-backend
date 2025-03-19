import type { AppRouteHandler } from "@/lib/types.js";
import type { ListRoute } from "@/routes/tasks/tasks.routes.js";

export const list: AppRouteHandler<ListRoute> = (c) => {
  return c.json([{ name: "Task 1", done: false }]);
};
