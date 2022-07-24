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
  S extends Struct<any, any> | z.ZodTypeAny,
  _C = unknown,
  R = unknown,
  CR = unknown,
  EF = unknown,
  ST = boolean
> = {
  safeMode?: ST;
  input?: SchemaType<S> extends object
    ? Record<keyof SchemaType<S>, unknown>
    : unknown;
  schema?: S;
  context?: ContextResolver<CR>;
  resolve: (
    validatedInput: SchemaType<S> extends null ? null : SchemaType<S>,
    ctx: Awaited<CR>
  ) => R;
  errorFormatter?: ErrorFormatter<EF>;
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
