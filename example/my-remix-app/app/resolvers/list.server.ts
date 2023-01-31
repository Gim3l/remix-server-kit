import { z } from "zod";
import { createResolver } from "../../../../src";

export const getList = createResolver({
  schema: z.object({ name: z.string() }),
  context: ({ request }) => {
    return { user: { userId: 20 } };
  },
  resolve({ name }, ctx, ev) {
    console.log({ name });
    if (name === "error") {
      return ev.fail({ message: "custom error" }, 400);
    }

    return ev.success([1, 2, 3, ctx.user.userId, name]);
  },
});
