import {
  ContextResolverArgs,
  // MatcherKeys,
  // MatcherOutput,
  ResolverConfig,
  SchemaType,
  SuccessResult,
} from "./types";
import { validate } from "./validation";
import { z } from "zod";
import { fail, success } from "./events";

class Resolver<Schema extends z.ZodTypeAny, Context, Result, IContextResolver> {
  resolver: ResolverConfig<Schema, Context, Result, IContextResolver>;
  ctxArgs?: ContextResolverArgs;

  constructor(
    resolver: ResolverConfig<Schema, Context, Result, IContextResolver>,
    ctxArgs?: ContextResolverArgs
  ) {
    this.resolver = resolver;
    this.ctxArgs = ctxArgs;
  }

  async call() {
    let data: Awaited<Result>;

    const schema = this.resolver.schema;
    const validatedInput = schema?.safeParse(this.resolver.input);

    if (schema && !validatedInput?.success) {
      return fail(null, 400, validatedInput?.error);
    }

    let ctx = null;

    if (this.resolver.context && this.ctxArgs) {
      ctx = await this.resolver.context({
        request: this.ctxArgs.request,
        data: this.ctxArgs?.data,
      });
    }

    data = await this.resolver.resolve(validatedInput as any, ctx as any, {
      fail,
      success,
    });

    if ((data as SuccessResult<Result>).success) {
      return data;
    }

    return success(data);
  }
}

/** Create a resolver */
export const createResolver = <
  Schema extends z.ZodTypeAny,
  Context,
  Result,
  IContextResolver
>(
  resolverConfig: Pick<
    ResolverConfig<Schema, Context, Result, IContextResolver>,
    "resolve" | "schema" | "context"
  >
): ((
  args?: SchemaType<Schema> extends object
    ? Record<keyof SchemaType<Schema>, unknown>
    : unknown,
  ctxArgs?: ContextResolverArgs
) => Result) => {
  const { resolve, schema, context } = resolverConfig;

  const res = async (
    args?: SchemaType<Schema> extends object
      ? Record<keyof SchemaType<Schema>, unknown>
      : unknown,
    ctxArgs?: ContextResolverArgs
  ) => {
    return await new Resolver<Schema, Context, Result, IContextResolver>(
      { resolve, schema, input: args, context },
      ctxArgs
    ).call();
  };

  return res as any;
};

// export const createMatcher = <
//   K extends string | "default",
//   R extends Record<K, () => unknown>
// >(
//   resolvers: R
// ): MatcherOutput<K, R> => {
//   return {
//     resolvers,
//     async match<K2 extends K>(
//       key: K2,
//       options?: { toResponse?: boolean; throwValidationErrors?: boolean }
//     ): Promise<ReturnType<R[K2]> | Response> {
//       try {
//         const result = await resolvers[key]();

//         if (options?.toResponse === false) {
//           return result as Promise<ReturnType<R[K2]>>;
//         } else {
//           if (result instanceof Response) {
//             return result;
//           }

//           return json(result, { status: 400 });
//         }
//       } catch (err) {
//         if (err instanceof Response && err.statusText === "ValidationError") {
//           if (options?.throwValidationErrors === false) throw err;
//           return err;
//         }

//         throw err;
//       }
//     },
//     /** Ensures the supplied key matches the keys  */
//     validate(key): MatcherKeys<MatcherOutput<K, R>> {
//       const keys = Object.keys(resolvers);
//       const result = validate(key, enums(keys));
//       return result as MatcherKeys<MatcherOutput<K, R>>;
//     },
//   };
// };
