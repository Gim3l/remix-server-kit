import { z } from "zod";
import { FailResult, SchemaConfig, SuccessResult } from "./types";

export function fail<
  Schema extends z.ZodType,
  TSchemaConfig extends SchemaConfig,
  Data = unknown
>(
  data: Data,
  status: number,
  schemaErrors?: z.ZodError<Schema>,
  schemaConfig?: TSchemaConfig
): FailResult<Schema, Data, TSchemaConfig> {
  // set tye type of schemaValidationErrors to the correct type based on the schemaConfig format
  let schemaValidationErrors: unknown = schemaErrors;

  if (schemaConfig?.formatErr) {
    schemaValidationErrors = schemaErrors?.format();
  }

  if (schemaConfig?.flattenErr) {
    schemaValidationErrors = schemaErrors?.flatten();
  }

  return {
    status,
    success: false,
    fail: data,
    schemaErrors: schemaValidationErrors as any,
  };
}

export function success<Data = unknown>(
  data: Data,
  status: number = 200
): SuccessResult<Data> {
  return { status, success: true, data };
}
