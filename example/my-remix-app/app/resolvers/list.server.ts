import { number } from "superstruct";
import { createResolver } from "~/lib/remix-server-kit/src";

export const getList = createResolver({
  schema: number(),
  context: ({ request }) => {
    return { user: { userId: 20 } };
  },
  resolve(data, ctx) {
    console.log({ ctx });
    return [1, 2, 3, ctx.user.userId, data];
  },
});
