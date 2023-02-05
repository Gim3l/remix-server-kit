import { z } from "zod";
import { createResolver, unstable_createResolver } from "../../../../src";
import { ResolverError } from "../../../../src/updates";
import { errorCodes } from "../../../../src/utils";

const listSchema = z.object({
  age: z.number(),
  name: z.string({
    description: "Enter a valid name",
    errorMap: (err) => ({
      message: "Enter a valid name",
    }),
  }),
});

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "bad type!" };
    }

    if (issue.expected === "number") {
      return { message: "that's not a number bro" };
    }
  }
  if (issue.code === z.ZodIssueCode.custom) {
    return { message: `less-than-${(issue.params || {}).minimum}` };
  }
  return { message: ctx.defaultError };
};

export const getList = unstable_createResolver({
  schema: listSchema,
  schemaConfig: {
    formatErr: true,
    // flattenErr: true,
    // throwOnFail: true,
    errorMap: customErrorMap,
  },
  context: () => {
    return { user: { userId: 1 } };
  },
  async resolve({ name, age }, { user }) {
    if (name === "error") {
      throw new ResolverError("Resolver failed!", errorCodes.BAD_REQUEST);
    }

    return { userId: user.userId, age, name };
  },
});

const schema = z.object({ name: z.string() });
const result = schema.safeParse({ name: 1 });

if (!result.success) {
  console.log(result.error);
}
