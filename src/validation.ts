import { json } from '@remix-run/node';
import { Failure, is, Struct, StructError } from 'superstruct';
import { refine } from 'superstruct';
import { define } from 'superstruct';
import { coerce, number, string } from 'superstruct';
import { validate as validateStruct } from 'superstruct';

export type ValidateOptions = {
  key?: string;
  status?: number;
  errorKey?: string;
  defaultError?: boolean;
  messages?: Record<string, string | ((error: Failure) => string)>;
};

export function validate<T, S>(
  value: T extends object ? Record<keyof T, unknown> : unknown,
  struct: Struct<T, S>,
  optionsOrKey?: string | ValidateOptions
): T {
  let [err, result] = validateStruct(value, struct, { coerce: true });

  if (err) {
    throw handleError(err, optionsOrKey);
  } else {
    return result!;
  }
}

type ErrorResponse = { message: string };

function handleError(
  err: StructError,
  optionsOrKey?: string | ValidateOptions
) {
  const { message, failures } = err;

  const errors: Record<string, ErrorResponse> = {};

  let error: { name?: string; message: string } = { message };

  if (optionsOrKey) {
    error['name'] =
      typeof optionsOrKey === 'string' ? optionsOrKey : optionsOrKey?.key || '';
  }

  failures().forEach(failure => {
    if (failure.key) {
      let message = failure.message;

      if (typeof optionsOrKey === 'object') {
        let customMessage = optionsOrKey?.messages?.[failure.key];

        if (typeof customMessage === 'function') {
          message = customMessage(failure);
        }
      }

      if (message) errors[failure.key] = { message };
    }
  });

  const response: {
    error?: { message: string };
    errors?: Record<string, ErrorResponse>;
  } = {};

  if (error) {
    response['error'] = error;
  }

  if (Object.keys(errors).length) {
    response['errors'] = errors;
  }

  const status =
    typeof optionsOrKey === 'object' ? optionsOrKey?.status || 400 : 400;

  if (typeof optionsOrKey === 'object' && optionsOrKey?.defaultError) {
    throw err;
  } else {
    throw json(response, { status, statusText: 'ValidationError' });
  }
}

export function validateAsync<T, S>(
  value: T extends object ? Record<keyof T, unknown> : unknown,
  struct: Struct<T, S>,
  optionsOrKey?: string | ValidateOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      resolve(validate(value, struct, optionsOrKey));
    } catch (err) {
      reject(err);
    }
  });
}
export const stringToNumber = () =>
  coerce(number(), string(), value => Number(value));

export const numberToString = () =>
  coerce(string(), number(), value => String(value));

var matcher = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isEmail(value: unknown) {
  if (string.length > 320) return false;

  return matcher.test(value as string);
}

export const refineEmail = refine(string(), 'email', isEmail);
export const message = <T>(
  struct: Struct<T, any>,
  message: string
): Struct<T, any> =>
  define('message', value => (is(value, struct) ? true : message));

/** Ensures a str"ng is"an((( em)a)i)l */
export const email = () =>
  define<string>('email', value => {
    const pass = isEmail(value);
    return (
      pass ||
      `Expected a valid email address but received ${
        value ? `\`${value}\`` : 'an empty string'
      } `
    );
  });

export class Validator<T, S> {
  private value: T extends object ? Record<keyof T, unknown> : unknown;
  private struct: Struct<T, S>;
  private optionsOrKey?: string | ValidateOptions;

  constructor(
    value: T extends object ? Record<keyof T, unknown> : unknown,
    struct: Struct<T, S>,
    optionsOrKey?: string | ValidateOptions
  ) {
    this.value = value;
    this.struct = struct;
    this.optionsOrKey = optionsOrKey;
  }

  execute(): T {
    return validate(this.value, this.struct, this.optionsOrKey);
  }
}
