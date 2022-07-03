import { json } from "@remix-run/node";
import { ContextResolverArgs, ResolverConfig } from "./types";
import { enums } from "superstruct";
import { validate } from "./validation";

class Resolver<T, S, C, R, CR> {
  resolver: ResolverConfig<T, S, C, R, CR>;
  ctxArgs?: ContextResolverArgs;

  constructor(
    resolver: ResolverConfig<T, S, C, R, CR>,
    ctxArgs?: ContextResolverArgs
  ) {
    this.resolver = resolver;
    this.ctxArgs = ctxArgs;
  }

  async call() {
    const schema = this.resolver.schema;
    const validateInput = validate(this.resolver.input as any, schema as any);
    let ctx = null;

    if (this.resolver.contextResolver && this.ctxArgs) {
      ctx = await this.resolver.contextResolver({
        request: this.ctxArgs.request,
        data: this.ctxArgs?.data,
      });
    }

    return this.resolver.resolve(validateInput as any, ctx as any);
  }
}

/** Create a resolver */
export const createResolver = <T, S, C, R, CR>(
  resolverConfig: Pick<
    ResolverConfig<T, S, C, R, CR>,
    "resolve" | "schema" | "contextResolver"
  >
): ((
  args?: T extends object ? Record<keyof T, unknown> : unknown,
  ctxArgs?: ContextResolverArgs
) => Promise<R>) => {
  const { resolve, schema, contextResolver } = resolverConfig;

  const res = async (
    args?: T extends object ? Record<keyof T, unknown> : unknown,
    ctxArgs?: ContextResolverArgs
  ) =>
    await new Resolver<T, S, C, R, CR>(
      { resolve, schema, input: args, contextResolver },
      ctxArgs
    ).call();

  return res;
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

export const createMatcher = <
  K extends string | "default",
  R extends Record<K, () => unknown>
>(
  resolvers: R
): MatcherOutput<K, R> => {
  return {
    resolvers,
    async match<K2 extends K>(
      key: K2,
      options?: { toResponse?: boolean; throwValidationErrors?: boolean }
    ): Promise<ReturnType<R[K2]> | Response> {
      try {
        const result = await resolvers[key]();

        if (options?.toResponse === false) {
          return result as Promise<ReturnType<R[K2]>>;
        } else {
          if (result instanceof Response) {
            return result;
          }

          return json(result, { status: 400 });
        }
      } catch (err) {
        if (err instanceof Response && err.statusText === "ValidationError") {
          if (options?.throwValidationErrors === false) throw err;
          return err;
        }

        throw err;
      }
    },
    /** Ensures the supplied key matches the keys  */
    validate(key): MatcherKeys<MatcherOutput<K, R>> {
      const keys = Object.keys(resolvers);
      const result = validate(key, enums(keys));
      return result as MatcherKeys<MatcherOutput<K, R>>;
    },
  };
};
