import { json } from "@remix-run/node";
import { Failure, is, nonempty, Struct, StructError } from "superstruct";
import { define } from "superstruct";
import { coerce, number, string } from "superstruct";
import { validate as validateStruct } from "superstruct";
import * as z from "zod";

export type ValidateOptions = {
  key?: string;
  status?: number;
  errorKey?: string;
  defaultError?: boolean;
  messages?: Record<string, string | ((error: Failure) => string)>;
};

export class ValidationError<T> extends Error {
  failures: T;

  constructor(message: string, errors: T) {
    super(message);
    this.failures = errors;
    this.name = "ValidationError";
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

  return new ValidationError("Error validation data", errors);
};

// function handleError(
//   err: StructError | z.ZodError,
//   optionsOrKey?: string | ValidateOptions
// ) {
//   if (err instanceof StructError) {
//     const { message, failures } = err;

//     const errors: Record<string, ErrorResponse> = {};

//     let error: { name?: string; message: string } = { message };

//     if (optionsOrKey) {
//       error["name"] =
//         typeof optionsOrKey === "string"
//           ? optionsOrKey
//           : optionsOrKey?.key || "";
//     }

//     failures().forEach((failure) => {
//       if (failure.key) {
//         let message = failure.message;

//         if (typeof optionsOrKey === "object") {
//           let customMessage = optionsOrKey?.messages?.[failure.key];

//           if (typeof customMessage === "function") {
//             message = customMessage(failure);
//           }
//         }

//         if (message) errors[failure.key] = { message };
//       }
//     });

//     const response: {
//       error?: { message: string };
//       errors?: Record<string, ErrorResponse>;
//     } = {};

//     if (error) {
//       response["error"] = error;
//     }

//     if (Object.keys(errors).length) {
//       response["errors"] = errors;
//     }

//     const status =
//       typeof optionsOrKey === "object" ? optionsOrKey?.status || 400 : 400;

//     if (typeof optionsOrKey === "object" && optionsOrKey?.defaultError) {
//       throw err;
//     } else {
//       throw json(response, { status, statusText: "ValidationError" });
//     }
//   } else {
//     const errors;
//     err.issues.map((issue) => {});
//   }
// }

export function validateAsync<T, S>(
  value: T extends object ? Record<keyof T, unknown> : unknown,
  struct: Struct<T, S> | z.ZodType<T>,
  optionsOrKey?: string | ValidateOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      resolve(validate(value, struct));
    } catch (err) {
      reject(err);
    }
  });
}
export const stringToNumber = () =>
  coerce(number(), string(), (value) => Number(value));

export const numberToString = () =>
  coerce(string(), number(), (value) => String(value));

var matcher =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isEmail(value: unknown) {
  if (string.length > 320) return false;

  return matcher.test(value as string);
}

/** Send a custom message when validation fails */
export const message = <T>(
  struct: Struct<T, any>,
  message: string
): Struct<T, any> =>
  define("message", (value) => (is(value, struct) ? true : message));

/** Make sure a string, array, field, or set is not empty and send a '$fieldName is required' message  */
export const required = <T extends string | any[] | Map<any, any> | Set<any>>(
  struct: Struct<T, any>,
  fieldName: string
) => message(nonempty(struct), `${fieldName} is required`);

/** Ensures a str"ng is"an((( em)a)i)l */
export const email = () =>
  define<string>("email", (value) => {
    const pass = isEmail(value);
    return (
      pass ||
      `Expected a valid email address but received ${
        value ? `\`${value}\`` : "an empty string"
      } `
    );
  });

export class Validator<T, S> {
  private value: T extends object ? Record<keyof T, unknown> : unknown;
  private schema: Struct<T, S> | z.ZodType<T>;

  constructor(
    value: T extends object ? Record<keyof T, unknown> : unknown,
    struct: Struct<T, S> | z.ZodType<T>
  ) {
    this.value = value;
    this.schema = struct;
  }

  execute(): T {
    return validate(this.value, this.schema);
  }
}

/** Check if an error is a validation error */
export const isValidationError = (err: unknown) => {
  return err instanceof Response && err.statusText === "ValidationError";
};
