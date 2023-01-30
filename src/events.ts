import { z } from "zod";
import { FailResult, SuccessResult } from "./types";

export function fail<Schema = unknown, Data = unknown>(
  data: Data,
  status: number,
  schemaErrors?: z.ZodError<Schema>
): FailResult<Schema, Data> {
  return {
    status,
    success: false,
    fail: data,
    schemaErrors,
  };
}

export function success<Data = unknown>(
  data: Data,
  status: number = 200
): SuccessResult<Data> {
  return { status, success: true, data };
}
