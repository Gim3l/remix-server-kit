import { Failure, Struct, StructError } from "superstruct";
import { validate as validateStruct } from "superstruct";
import * as z from "zod";

export type ValidateOptions = {
  key?: string;
  status?: number;
  errorKey?: string;
  defaultError?: boolean;
  messages?: Record<string, string | ((error: Failure) => string)>;
};

export class ResolverError<T> extends Error {
  data: T;
  cause?: Error;

  constructor(message: string, data: T, cause: Error) {
    super(message);
    this.data = data;
    this.name = "ResolverError";
    this.cause = cause;
  }
}

export function validate<T, S>(
  value: T extends object ? Record<keyof T, unknown> : unknown,
  schema: Struct<T, S> | z.ZodType<T>
): T {
  if (schema instanceof Struct) {
    let [err, result] = validateStruct(value, schema, { coerce: true });

    if (!err) {
      return result!;
    } else {
      throw parseError(err);
    }
  } else {
    // handle zod
    const data = schema.safeParse(value);

    if (data.success) {
      return data.data;
    } else {
      throw parseError(data.error);
    }
  }
}

// const data = validate({ name: "hello" }, object({ name: string() }));

export type TValidationError = { path: (string | number)[]; message: string };

const parseError = <T>(err: StructError | z.ZodError<T>) => {
  const errors: TValidationError[] = [];

  if (err instanceof StructError) {
    err.failures().forEach((failure) => {
      errors.push({ path: failure.path, message: failure.message });
    });
  } else {
    // error is zod error
    err.issues.forEach((issue) => {
      errors.push({ path: issue.path, message: issue.message });
    });
  }

  return new ResolverError("Error validating data", errors, err);
};
export const isValidationError = (err: unknown) => {
  return err instanceof Response && err.statusText === "ValidationError";
};
