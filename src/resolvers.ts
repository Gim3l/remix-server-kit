import { json } from "@remix-run/node";
import {
  ContextResolverArgs,
  MatcherKeys,
  MatcherOutput,
  ResolverConfig,
} from "./types";
import { enums  } from "superstruct";
import { TValidationError, validate, ResolverError } from "./validation";

class Resolver<T, S, C, R, CR, EF, ST extends boolean> {
  resolver: ResolverConfig<T, S, C, R, CR, EF, ST>;
  ctxArgs?: ContextResolverArgs;

  constructor(
    resolver: ResolverConfig<T, S, C, R, CR, EF, ST>,
    ctxArgs?: ContextResolverArgs
  ) {
    this.resolver = resolver;
    this.ctxArgs = ctxArgs;
  }

  async call() {
    type ValidationErrorType = unknown extends EF ? TValidationError[] : EF;

    let data: Awaited<R>;
    let resolverError: ResolverError<ValidationErrorType> | null;

    try {
      const schema = this.resolver.schema;
      const validatedInput = schema ? validate(this.resolver.input as any, schema as any) : this.resolver.input;

      let ctx = null;

      if (this.resolver.context && this.ctxArgs) {
        ctx = await this.resolver.context({
          request: this.ctxArgs.request,
          data: this.ctxArgs?.data,
        });
      }

      data = await this.resolver.resolve(validatedInput as any, ctx as any);
    } catch (err) {
      if (err instanceof Response) {
        throw err;
      }

      const isResolverError = err instanceof ResolverError


      const formattedError = this.resolver.errorFormatter ? (
        await this.resolver.errorFormatter(
           isResolverError && err?.message === "Error validating data" ?
          { validationError: err, error: undefined} :
          { validationError: undefined, error: err })
      ) as Awaited<ValidationErrorType> : null;

        // convert formatted error to resolver error
        resolverError = new ResolverError<ValidationErrorType>(
          "Error validating data",
          formattedError ? formattedError : err instanceof ResolverError<EF> ? err?.data : null,
        err instanceof ResolverError<EF> ? err?.cause : (err as any)
        );
      

        // when in safe mode, we don't throw the error
        if (this.resolver.safeMode) {
          return { data: null, error: resolverError };
        } else {
          throw resolverError;
        }

      
    }

    if (this.resolver.safeMode) {
      return { data, error: null };
    } else {
      return data;
    }
  }
}

/** Create a resolver */
export const createResolver = <T, S, C, R, CR, EF, ST extends boolean>(
  resolverConfig: Pick<
    ResolverConfig<T, S, C, R, CR, EF, ST>,
    "resolve" | "schema" | "context" | "errorFormatter" | "safeMode"
  >
): ((
  args?: T extends object ? Record<keyof T, unknown> : unknown,
  ctxArgs?: ContextResolverArgs
) => false extends typeof resolverConfig.safeMode
  ? R
  : Promise<{
      data: R extends Promise<unknown> ? (Awaited<R> | null) : (R | null);
      error: ResolverError<unknown extends EF ? TValidationError[] : EF> | null;
    }>) => {
  const { resolve, schema, context, errorFormatter, safeMode } =
    resolverConfig;

  const res = async (
    args?: T extends object ? Record<keyof T, unknown> : unknown,
    ctxArgs?: ContextResolverArgs
  ) => {
    return await new Resolver<T, S, C, R, CR, EF, ST>(
      { resolve, schema, input: args, context, errorFormatter, safeMode },
      ctxArgs
    ).call();
  };

  return res as any;
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
