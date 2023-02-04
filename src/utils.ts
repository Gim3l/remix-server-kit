export type AssertEqual<T, Expected> = [T] extends [Expected]
  ? [Expected] extends [T]
    ? true
    : false
  : false;

export const errorCodes = {
  BAD_REQUEST: 400 as 400,
  UNAUTHORIZED: 401 as 401,
  FORBIDDEN: 403 as 403,
  NOT_FOUND: 404 as 404,
  INTERNAL_SERVER_ERROR: 500 as 500,
  TIMEOUT: 504 as 504,
  CONFLICT: 409 as 409,
  CREATED: 201 as 201,
};
