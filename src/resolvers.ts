import { json } from "@remix-run/node";
import {
  ContextResolverArgs,
  MatcherKeys,
  MatcherOutput,
  ResolverConfig,
} from "./types";
import { enums } from "superstruct";
import { TValidationError, validate, ValidationError } from "./validation";

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
    // unknown extends typeof this.resolver.errorFormatter
    //   ? TValidationError[]
    //   : Awaited<EF>;

    let data: Awaited<R>;
    let validationError: ValidationError<ValidationErrorType> | null;

    try {
      const schema = this.resolver.schema;
      const validateInput = validate(this.resolver.input as any, schema as any);

      let ctx = null;

      if (this.resolver.context && this.ctxArgs) {
        ctx = await this.resolver.context({
          request: this.ctxArgs.request,
          data: this.ctxArgs?.data,
        });
      }

      data = await this.resolver.resolve(validateInput as any, ctx as any);
    } catch (err) {
      if (err instanceof ValidationError && this.resolver.errorFormatter) {
        // throw await this.resolver.errorFormatter({ error: err });
        const error = (await this.resolver.errorFormatter({
          error: err,
        })) as Awaited<ValidationErrorType>;

        validationError = new ValidationError<ValidationErrorType>(
          "Error validating data",
          error
        );

        if (this.resolver.safeValidation) {
          return { data: null, validationError };
        } else {
          throw validationError;
        }
      }

      throw err;
    }

    if (this.resolver.safeValidation) {
      return { data, validationError: null };
    } else {
      return data;
    }
  }
}

/** Create a resolver */
export const createResolver = <T, S, C, R, CR, EF, ST extends boolean>(
  resolverConfig: Pick<
    ResolverConfig<T, S, C, R, CR, EF, ST>,
    "resolve" | "schema" | "context" | "errorFormatter" | "safeValidation"
  >
): ((
  args?: T extends object ? Record<keyof T, unknown> : unknown,
  ctxArgs?: ContextResolverArgs
) => true extends typeof resolverConfig.safeValidation
  ? R
  : Promise<{
      data: R | null;
      validationError: ValidationError<
        unknown extends EF ? TValidationError[] : EF
      > | null;
    }>) => {
  const { resolve, schema, context, errorFormatter, safeValidation } =
    resolverConfig;

  const res = async (
    args?: T extends object ? Record<keyof T, unknown> : unknown,
    ctxArgs?: ContextResolverArgs
  ) => {
    return await new Resolver<T, S, C, R, CR, EF, ST>(
      { resolve, schema, input: args, context, errorFormatter, safeValidation },
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
