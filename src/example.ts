import { z } from "zod";
import { createResolver } from "./resolvers";

const add = createResolver({
  context: () => ({ number: 20 }),
  safeValidation: false,
  schema: z.object({ name: z.string(), email: z.string().email() }),
  async resolve({ email, name }, { number }) {
    return { name: "John" };
  },
});

const result = await add({ email: "cool@mail.com", name: "cool" });
result.error;
