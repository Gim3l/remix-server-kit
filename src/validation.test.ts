import { test, describe, expect } from "vitest";

import { validate } from "./validation";
import { z } from "zod";
import * as t from "superstruct";
import { AssertEqual } from "./utils";

describe("test validation", () => {
  test("validate works", () => {
    expect(() =>
      validate({ name: "John" }, z.object({ name: z.string() }))
    ).not.toThrow();

    expect(() =>
      validate({ name: "John" }, t.object({ name: t.string() }))
    ).not.toThrow();
  });

  test("validate returns correct data", () => {
    const complexData = { user: { email: "johnny@mail.com" } };
    const simpleData = "John";

    const zodData = validate(simpleData, t.string());
    const superStructData = validate(simpleData, t.string());

    const zodComplexData = validate(
      complexData,
      z.object({ user: z.object({ email: z.string() }) })
    );
    const superStructComplexData = validate(
      complexData,
      z.object({ user: z.object({ email: z.string() }) })
    );

    expect(zodData).toBe(simpleData);
    expect(superStructData).toBe(simpleData);

    expect(zodComplexData).toStrictEqual(complexData);
    expect(superStructComplexData).toStrictEqual(complexData);

    const t1: AssertEqual<typeof zodComplexData, { user: { email: string } }> =
      true;

    const t2: AssertEqual<
      typeof superStructComplexData,
      { user: { email: string } }
    > = true;

    [t1, t2];
  });
});
