import { test, describe, expect, vi } from "vitest";
import { z } from "zod";
import * as t from "superstruct";
import { createResolver } from "./resolvers";
import { AssertEqual } from "./utils";
import { ResolverError } from "./validation";
import { StructError } from "superstruct";
import { json, Response, Headers } from "@remix-run/node";

vi.stubGlobal("Headers", Headers);
vi.stubGlobal("Response", Response);

class TestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

describe("test resolvers", () => {
  test.each([
    ["zod", z.object({ num1: z.number(), num2: z.number() })],
    ["superstruct", t.object({ num1: t.number(), num2: t.number() })],
  ])("can create resolver with %s", async (name, schema) => {
    const add = createResolver({
      schema,
      async resolve({ num1, num2 }) {
        return num1 + num2;
      },
    });

    const t1: AssertEqual<Awaited<ReturnType<typeof add>>, number> = true;

    [t1];

    expect(add({ num1: 100, num2: 220 })).resolves.toBe(320);
    expect(add({ num1: "200", num2: 220 })).rejects.toThrow();
    await expect(add({ num1: "200", num2: 220 })).rejects.toBeInstanceOf(
      ResolverError
    );
    const err = await add({ num1: "200", num2: 100 }).catch((err) => err);

    expect((err as ResolverError<any>).data?.length).toEqual(1);
    expect((err as ResolverError<any>).cause).toBeInstanceOf(
      name === "zod" ? z.ZodError : StructError
    );
  });

  test.each([
    ["zod", z.object({ num1: z.number(), num2: z.number() })],
    ["superstruct", t.object({ num1: t.number(), num2: t.number() })],
  ])("can create resolver with formatter (%s)", async (_name, schema) => {
    const add = createResolver({
      errorFormatter: ({ validationError }) => {
        return "Error when validating data" + validationError?.data?.length;
      },
      schema,
      async resolve({ num1, num2 }) {
        return num1 + num2;
      },
    });

    expect(add({ num1: "2", num2: "cool" })).rejects.toBeInstanceOf(
      ResolverError
    );

    const error = await add({ num1: 2, num2: "cool" }).catch((err) => err);

    expect(error.message).toBe("Error validating data");
    expect((error as ResolverError<string>).data).toBe(
      "Error when validating data" + 1
    );
  });

  test.each([
    ["zod", z.object({ num1: z.number(), num2: z.number() })],
    ["superstruct", t.object({ num1: t.number(), num2: t.number() })],
  ])("safe mode works (%s)", async (_name, schema) => {
    const minus = createResolver({
      safeMode: true,
      schema,
      resolve({ num1, num2 }) {
        return num1 - num2;
      },
    });

    const add = createResolver({
      safeMode: true,
      schema,
      async resolve({ num1, num2 }) {
        throw json({ num1, num2 }, { statusText: "ValidationError" });
      },
    });

    // responses are thrown
    expect(add({ num1: 20, num2: 200 })).rejects.toThrowError(Response);
    expect(add({ num1: "200", num2: 200 })).resolves;

    const result = await add({ num1: "200", num2: "200" });

    expect(result.error).toBeInstanceOf(ResolverError);
    expect(result.error?.data.length).toBe(2);
    expect(result.data).toBe(null);

    const result2 = await minus({ num1: 200, num2: 300 });
    expect(result2.data).toBe(-100);
  });

  test("arbritary errors can be formatter", async () => {
    const resolver = createResolver({
      safeMode: true,
      errorFormatter: ({ error }) => {
        if (error instanceof TestError) {
          return error.message;
        }

        return error;
      },
      resolve() {
        throw new TestError("test");
      },
    });

    const result = await resolver({ name: "cool" });

    expect(result.error?.cause).toBeInstanceOf(TestError);
  });
});
