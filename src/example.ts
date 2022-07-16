import { z } from "zod";
import { createResolver } from "./resolvers";

const add = createResolver({
  safeValidation: false,
  errorFormatter: ({ error }) => {
    return "cooo";
  },
  schema: z.object({ name: z.string(), email: z.string().email() }),
  async resolve() {
    return { name: "John" };
  },
});

const result = await add({ email: "cool@mail.com", name: "cool" });

result.validationError;
