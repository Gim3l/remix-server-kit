import { z } from "zod";
import { errorCodes } from "./utils";
import { TValidationError, ResolverError } from "./validation";

export type ContextResolverArgs = { request: Request; data?: unknown };
export type ContextResolver<CR> = (args: ContextResolverArgs) => CR;

export type ErrorFormatter<T> = ({
  error,
}: {
  validationError?: ResolverError<TValidationError[]>;
  error?: unknown;
}) => T;

export type SchemaType<S = unknown> = S extends z.ZodTypeAny ? z.infer<S> : S;

export type ResolverConfig<
  Schema extends z.ZodTypeAny,
  _C = unknown,
  IContextResolver = unknown,
  TSchemaConfig extends SchemaConfig = SchemaConfig,
  ResolverResult = unknown
> = {
  input?: SchemaType<Schema> extends object
    ? Record<keyof SchemaType<Schema>, unknown>
    : unknown;
  schema?: Schema;
  context?: ContextResolver<IContextResolver>;
  resolve: <Result extends ResolverResult>(
    validatedInput: SchemaType<Schema> extends null ? null : SchemaType<Schema>,
    ctx: Awaited<IContextResolver>,
    event: ResolverEvent<Schema, TSchemaConfig> & { status: typeof errorCodes }
  ) => Result;

  schemaConfig?: TSchemaConfig;
};

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

export type ResolverEvent<
  Schema extends z.ZodType,
  TSchemaConfig extends SchemaConfig
> = {
  fail: <T>(data: T, status: number) => FailResult<Schema, T, TSchemaConfig>;
  success: <T>(data: T, status?: number) => SuccessResult<T>;
};

export type MatcherKeys<T extends MatcherOutput<any, any>> =
  T["resolvers"] extends Record<infer N, unknown> ? N : never;

export type MatcherReturnType<
  T extends MatcherOutput<any, any>,
  K extends MatcherKeys<T>
> = ReturnType<T["resolvers"][K]>;

export type MatcherOutput<
  K extends string | "default",
  R extends Record<K, () => unknown>
> = {
  match: <K2 extends K>(
    key: K2,
    options?: { toResponse?: boolean; throwValidationErrors?: boolean }
  ) => Promise<ReturnType<R[K2]> | Response>;
  validate: (key: unknown) => MatcherKeys<MatcherOutput<K, R>>;
  resolvers: R;
};

export type FailResult<
  Schema extends z.ZodType,
  Data,
  TSchemaConfig extends SchemaConfig
> = {
  success: false;
  status: number;
  fail: Data;
  schemaErrors?: TSchemaConfig["formatErr"] extends true
    ? z.inferFormattedError<Schema> | undefined
    : TSchemaConfig["flattenErr"] extends true
    ? z.inferFlattenedErrors<Schema> | undefined
    : z.ZodError<Schema> | undefined;
};

export type SuccessResult<T = void> = {
  success: true;
  result: T;
};

export type UnwrapSuccessResult<T> = T extends SuccessResult<infer U>
  ? U
  : never;

export type UnwrapFailResult<
  Schema extends z.ZodType,
  T,
  TSchemaConfig extends SchemaConfig
> = T extends FailResult<Schema, infer U, TSchemaConfig> ? U : never;
