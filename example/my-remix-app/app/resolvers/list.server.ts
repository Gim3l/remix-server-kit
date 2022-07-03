import { number } from "superstruct";
import { createResolver } from "~/lib/remix-server-kit/src";

export const getList = createResolver({
  schema: number(),
  contextResolver: ({ request }) => {
    return { user: { userId: 20 } };
  },
  resolve(data, ctx) {
    return [1, 2, 3, ctx.user.userId, data];
  },
});
