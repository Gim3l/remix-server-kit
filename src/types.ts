import { Infer, Struct } from "superstruct";
import { z } from "zod";
import { TValidationError, ResolverError } from "./validation";

export type ContextResolverArgs = { request: Request; data?: unknown };
export type ContextResolver<CR> = (args: ContextResolverArgs) => CR;

export type ErrorFormatter<T> = ({
  error,
}: {
  validationError?: ResolverError<TValidationError[]>;
  error?: unknown;
}) => T;

export type SchemaType<S = unknown> = S extends Struct<any, any>
  ? Infer<S>
  : S extends z.ZodTypeAny
  ? z.infer<S>
  : S;

export type ResolverConfig<
  Schema extends Struct<any, any> | z.ZodTypeAny,
  _C = unknown,
  Result = unknown,
  IContextResolver = unknown,
  ErrorFormat = unknown,
  ST = boolean
> = {
  safeMode?: ST;
  input?: SchemaType<Schema> extends object
    ? Record<keyof SchemaType<Schema>, unknown>
    : unknown;
  schema?: Schema;
  context?: ContextResolver<IContextResolver>;
  resolve: (
    validatedInput: SchemaType<Schema> extends null ? null : SchemaType<Schema>,
    ctx: Awaited<IContextResolver>,
    event: ResolverEvent<Schema>
  ) => Result;
  errorFormatter?: ErrorFormatter<ErrorFormat>;
};

type ResolverEvent<Schema> = {
  fail: <T>(data: T, status: number) => FailResult<Schema, T>;
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

export type FailResult<Schema, Data> = {
  success: false;
  status: number;
  fail: Data;
  schemaErrors?: z.ZodError<Schema>;
};

export type SuccessResult<T> = {
  success: true;
  status: number;
  data: T;
};
