import { z } from "zod";
import { fail, success } from "./events";
import {
  FailResult,
  ResolverEvent,
  SchemaConfig,
  SchemaType,
  SuccessResult,
  UnwrapSuccessResult,
} from "./types";
import { errorCodes } from "./utils";

export const unstable_createResolver = <
  Schema extends z.ZodType,
  ContextFn extends (args: any) => any,
  TSchemaConfig extends SchemaConfig,
  Result
>({
  resolve,
  schema,
  schemaConfig,
  context,
}: {
  resolve: (
    validatedInput: z.infer<Schema>,
    ctx: ReturnType<ContextFn>,
    event: ResolverEvent<Schema, TSchemaConfig> & { status: typeof errorCodes }
  ) => Promise<Result>;
  schema: Schema;
  schemaConfig?: TSchemaConfig;
  context?: ContextFn;
}) => {
  return async function (
    input: SchemaType<Schema> extends object
      ? Record<keyof SchemaType<Schema>, unknown>
      : unknown,
    ctxInput?: Parameters<ContextFn>[0]
  ) {
    const validatedInput = await schema.safeParseAsync(input, {
      errorMap: schemaConfig?.errorMap,
    });

    try {
      if (validatedInput.success === true) {
        let ctxData;

        if (context) {
          ctxData = context(ctxInput as any);
        }

        const data = await resolve(validatedInput.data, ctxData as any, {
          fail,
          success,
          status: errorCodes,
        });

        return {
          success: true as true,
          info: data,
          schemaErr: null,
          resolverErr: null,
        };
      } else {
        if (schemaConfig?.throwOnFail) {
          throw validatedInput.error;
        }

        return {
          success: false as false,
          schemaErr: formatErr<Schema, TSchemaConfig>(
            validatedInput.error,
            schemaConfig as TSchemaConfig
          ),
          resolverErr: null,
        };
      }
    } catch (err) {
      if (err instanceof ResolverError) {
        return {
          success: false as false,
          resolverErr: { message: err.message, status: err.status, err },
          schemaErr: validatedInput.success
            ? null
            : formatErr<Schema, TSchemaConfig>(
                validatedInput.error,
                schemaConfig as TSchemaConfig
              ),
        };
      }

      throw err;
    }
  };
};

const resolver = unstable_createResolver({
  schema: z.object({ name: z.string(), age: z.number() }),
  schemaConfig: {
    formatErr: true,
  },
  // context: contextFn,
  async resolve({ name, age }, { userId }) {
    return { name: "hello", age: 20 };
  },
});

// const result = await resolver({ name: "hello", age: 20 }, { age: 20 });

// if (result.success) {
//   result.data.age;
// } else {
//   result.resolverErr?.status;
//   result?.schemaErr?.age?._errors[0];
// }
//   console.log(result.fail);

// ResolverError
export class ResolverError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResolverError";
    this.status = status;
  }
}

// class SchemaError<Schema extends z.ZodType> extends ResolverError {
//   zodError: z.ZodError<Schema>;
//   constructor(message: string, zodError: z.ZodError<Schema>) {
//     this.zodError = zodError;
//     super(message, errorCodes.BAD_REQUEST);
//   }
// }

function formatErr<
  Schema extends z.ZodType,
  TSchemaConfig extends SchemaConfig
>(
  error: z.ZodError<Schema>,
  schemaConfig: TSchemaConfig
): TSchemaConfig["formatErr"] extends true
  ? z.inferFormattedError<Schema> | undefined
  : TSchemaConfig["flattenErr"] extends true
  ? z.inferFlattenedErrors<Schema> | undefined
  : z.ZodError<Schema> | undefined {
  if (!schemaConfig) return error.errors as any;

  if (schemaConfig?.formatErr) {
    return error.format() as any;
  }

  if (schemaConfig?.flattenErr) {
    return error.flatten() as any;
  }

  return error as any;
}
