import {
  ContextResolverArgs,
  FailResult,
  // MatcherKeys,
  // MatcherOutput,
  ResolverConfig,
  SchemaConfig,
  SchemaType,
  SuccessResult,
} from "./types";
import { z } from "zod";
import { fail, success } from "./events";
import { errorCodes } from "./utils";

class Resolver<
  Schema extends z.ZodTypeAny,
  Context,
  IContextResolver,
  TSchemaConfig extends SchemaConfig
> {
  resolver: ResolverConfig<Schema, Context, IContextResolver, TSchemaConfig>;
  ctxArgs?: ContextResolverArgs;

  constructor(
    resolver: ResolverConfig<Schema, Context, IContextResolver, TSchemaConfig>,
    ctxArgs?: ContextResolverArgs
  ) {
    this.resolver = resolver;
    this.ctxArgs = ctxArgs;
  }

  async call() {
    const resolverFn = this.resolver.resolve;
    let data: ReturnType<typeof resolverFn>;

    const schema = this.resolver.schema;
    const validatedInput = schema?.safeParse(this.resolver.input, {
      errorMap: this.resolver.schemaConfig?.errorMap,
    });

    if (!validatedInput?.success) {
      if (this.resolver.schemaConfig?.throwOnFail) {
        throw fail(
          null as any,
          errorCodes.BAD_REQUEST,
          validatedInput?.error,
          this.resolver.schemaConfig
        );
      } else {
        return fail(
          null as any,
          errorCodes.BAD_REQUEST,
          validatedInput?.error,
          this.resolver.schemaConfig
        );
      }
    } else {
      let ctx = null;
      console.log({ test: this.ctxArgs?.data });

      if (this.resolver.context && this.ctxArgs) {
        ctx = await this.resolver.context({
          request: this.ctxArgs.request,
          data: this.ctxArgs?.data,
        });
      }

      data = await this.resolver.resolve(
        validatedInput?.data as any,
        ctx as any,
        {
          fail,
          success,
          status: errorCodes,
        }
      );

      // we need to check if the data is a success result, because the resolver might return a success result itself
      if (
        Object.keys(
          data as SuccessResult<Awaited<ReturnType<typeof resolverFn>>>
        ).includes("success")
      ) {
        return data;
      }

      return success(data);
    }
  }
}

// typescript convert all types of an object to unknown
// type UnknownProps<Schema> = SchemaType<Schema> extends object
//   ? Record<keyof SchemaType<Schema>, unknown>
//   : unknown;

// // now make it work for deep objects
// type UnknownPropsDeep<Schema> = SchemaType<Schema> extends object
//   ? {
//       [K in keyof SchemaType<Schema>]: SchemaType<Schema>[K] extends object
//         ? UnknownPropsDeep<SchemaType<Schema>[K]>
//         : unknown;
//     }
//   : unknown;

// ok, make it make arrays unknown too
// type UnknownPropsDeep<Schema> = SchemaType<Schema> extends object
//   ? {
//       [K in keyof SchemaType<Schema>]: SchemaType<Schema>[K] extends object
//         ? UnknownPropsDeep<SchemaType<Schema>[K]>
//         : SchemaType<Schema>[K] extends Array<infer U>
//         ? Array<UnknownPropsDeep<U>>
//         : unknown;
//     }
//   : unknown;

// type UnknownProps<Schema> = SchemaType<Schema> extends object
//   ? Record<keyof SchemaType<Schema>, unknown>
//   : unknown;

/** Create a resolver */
export const createResolver = <
  Schema extends z.ZodTypeAny,
  Context,
  IContextResolver,
  TSchemaConfig extends SchemaConfig,
  ResolverResult = unknown
>(
  resolverConfig: Pick<
    ResolverConfig<
      Schema,
      Context,
      IContextResolver,
      TSchemaConfig,
      ResolverResult
    >,
    "resolve" | "schema" | "context" | "schemaConfig"
  >
) => {
  const { resolve, schema, context, schemaConfig } = resolverConfig;

  const res = async (
    args?: SchemaType<Schema> extends object
      ? Record<keyof SchemaType<Schema>, unknown>
      : unknown,
    ctxArgs?: ContextResolverArgs
  ) => {
    return await new Resolver<Schema, Context, IContextResolver, TSchemaConfig>(
      { resolve, schema, input: args, context, schemaConfig },
      ctxArgs
    ).call();
    // ^?
  };

  return res;
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
