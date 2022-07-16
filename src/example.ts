import { z } from "zod";
import { createResolver } from "./resolvers";

const add = createResolver({
  safeMode: true,
  errorFormatter() {
    return 200;
  },
  context: () => ({ number: 20 }),
  schema: z.object({ name: z.string(), email: z.string().email() }),
  async resolve({ email, name }, { number }) {
    return { name: "John" };
  },
});

const result = await add({ email: "cool@mail.com", name: "cool" });
