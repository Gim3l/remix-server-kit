import { test, describe, expect } from "vitest";
import { z } from "zod";
import * as t from "superstruct";
import { createResolver } from "./resolvers";
import { AssertEqual } from "./utils";
import { ValidationError } from "./validation";

describe("test resolvers", () => {
  test.each([
    ["zod", z.object({ num1: z.number(), num2: z.number() })],
    ["superstruct", t.object({ num1: t.number(), num2: t.number() })],
  ])("can create resolver with %s", async (_name, schema) => {
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
      ValidationError
    );
    const err = await add({ num1: "200", num2: 100 }).catch((err) => err);

    expect((err as ValidationError<any>).failures.length).toBe(1);
  });

  test.each([
    ["zod", z.object({ num1: z.number(), num2: z.number() })],
    ["superstruct", t.object({ num1: t.number(), num2: t.number() })],
  ])("can create resolver with formatter (%s)", async (_name, schema) => {
    const add = createResolver({
      errorFormatter: ({ error }) => {
        console.log({ failures: error.failures });
        return "Error when validating data";
      },
      schema,
      async resolve({ num1, num2 }) {
        return num1 + num2;
      },
    });

    expect(add({ num1: "2", num2: "cool" })).rejects.toBeInstanceOf(
      ValidationError
    );

    const error = await add({ num1: "2", num2: "cool" }).catch((err) => err);

    expect(error.message).toBe("Error validating data");
    expect((error as ValidationError<string>).failures).toBe(
      "Error when validating data"
    );
  });
});
