import { z } from "zod";
import { createResolver, ResolverError } from "../../../../src/resolvers";
import { Logger } from "tslog";
import type { Submission } from "@conform-to/react";

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

const logger = new Logger();

export const getList = createResolver({
  schema: listSchema,
  // schemaConfig: {
  // formatErr: true,
  // flattenErr: true,
  // throwOnFail: true,
  // errorMap: customErrorMap,
  // },
  context: ({ input }: { input: string }) => {
    return {
      user: { userId: 1 },
      logger,
    };
  },
  async resolve({ name, age }, { user, logger }) {
    if (name === "error") {
      logger.error("Something broke!", { name, age });
      throw new ResolverError("Resolver failed!", "FORBIDDEN");
    }

    return { name, age, userId: user.userId };
  },
});

export const sendMessageSchema = z.object({
  name: z.string().min(5),
  message: z.string().min(5),
});

export const sendMessage = createResolver({
  schema: sendMessageSchema,
  context: ({
    submission,
  }: {
    submission: Submission<z.infer<typeof sendMessageSchema>>;
  }) => ({ submission }),
  async resolve({ name, message }, { submission }) {
    if (submission.type === "submit") {
      return { name, message };
    }
  },
});
