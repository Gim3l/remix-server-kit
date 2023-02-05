import { z } from "zod";
import { createResolver } from "../../../../src";

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

export const getList = createResolver({
  schema: listSchema,
  schemaConfig: {
    formatErr: true,
    // flattenErr: true,
    // throwOnFail: false,
    // errorMap: customErrorMap,
  },
  context: ({ request, data }) => {
    return { user: { userId: 1 } };
  },
  async resolve({ name, age }, { user }, { fail, status, success }) {
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

      return { userId: user.userId, age, name };
    } catch (err) {
      return fail({ message: "Something went wrong!" }, status.NOT_FOUND);
    }
  },
});

const schema = z.object({ name: z.string() });
const result = schema.safeParse({ name: 1 });
if (!result.success) {
  console.log(result.error);
}
