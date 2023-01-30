import { z } from "zod";
import { createContextResolver } from "./context";
import { createResolver } from "./resolvers";

const authContext = createContextResolver({
  resolve() {
    return { token: "hello" };
  },
});

// type FaResult<T extends FailData<T>> = {
//   success: false,
//   fail: T
// }

const schema = z.object({ input1: z.number(), input2: z.array(z.string()) });

const resolver = createResolver({
  context: authContext,
  schema,
  async resolve({ input1, input2 }, { token }, ev) {
    if (token) {
      return ev.success({ message: "hello" });
    } else {
      return ev.fail({ message: "no token" }, 401);
    }
  },
});

const result = await resolver({ a: "", b: [] });

if (result.success) {
  result?.data.message;
} else {
  result.fail.message;

  if (result.schemaErrors) {
    const errors = result.schemaErrors.format();

    errors._input?.input1;
  }
}
