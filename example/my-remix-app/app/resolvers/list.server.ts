import { z } from "zod";
import { createResolver } from "../../../../src";

export const getList = createResolver({
  schema: z.object({ name: z.string() }),
  context: ({ request, data }) => {
    return { user: { userId: 20 } };
  },
  async resolve({ name }, { user }, { fail, status, success }) {
    try {
      if (user.userId !== 1) {
        return fail(
          { message: "You are not authorized!" },
          status.UNAUTHORIZED
        );
      }

      if (name === "error") {
        throw new Error("This should fail");
      }

      return success([1, 2, 3, user.userId, name], status.CREATED);
    } catch (err) {
      return fail({ message: "Something went wrong!" }, status.NOT_FOUND);
    }
  },
});
