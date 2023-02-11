import { z } from "zod";
import { SchemaConfig, SchemaType } from "./types";
import { errorCodes, formatErr } from "./utils";

export const createResolver = <
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
    ctx: ReturnType<ContextFn>
  ) => Promise<Result>;
  schema: Schema;
  schemaConfig?: TSchemaConfig;
  context?: ContextFn;
  withConform?: boolean;
}) => {
  return async function (
    input: SchemaType<Schema> extends object
      ? Record<keyof SchemaType<Schema>, unknown>
      : unknown,
    ctxInput?: ContextFn extends (args: infer T) => unknown ? T : unknown
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

        const data = await resolve(validatedInput.data, ctxData as any);

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

export class ResolverError extends Error {
  status: number;

  constructor(message: string, status: keyof typeof errorCodes, cause?: Error) {
    super(message);
    this.name = "ResolverError";
    this.status = errorCodes[status];
    this.stack = cause?.stack;
  }
}
