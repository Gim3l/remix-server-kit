import { z } from "zod";

export type ContextResolverArgs = { request: Request; data?: unknown };
export type ContextResolver<CR> = (args: ContextResolverArgs) => CR;

export type SchemaType<S = unknown> = S extends z.ZodTypeAny ? z.infer<S> : S;

export type SchemaConfig =
  | {
      flattenErr: true;
      formatErr?: false;
      throwOnFail?: boolean;
      errorMap?: z.ZodErrorMap;
    }
  | {
      flattenErr?: false;
      formatErr: true;
      throwOnFail?: boolean;
      errorMap?: z.ZodErrorMap;
    };
