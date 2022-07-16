## Remix Server Kit

Remix server kit provides useful utilities and simplifies validation for actions and loaders.

## Installation

### With Zod

```shell
  npm install remix-server-kit zod
```

### With Superstruct

```shell
  npm install remix-server-kit superstruct
```

## Documentation

### Data Validation

You can validate data (formData, params, etc) using any of the following strategies:

#### validate

```typescript
  import type { ActionFunction } from "remix"
  import { validate } from "remix-server-kit";
  import { string, nonempty } from "superstruct"

  cosnt NonEmptyString = nonempty(string())

  // check if a value is a non-empty string
  export const action: ActionFunction = async ({request}) => {
    const formData = await request.formData()
    const name = validate(formData.get("name"), NonEmptyString)
    const description = validate(formData.get("name"), NonEmptyString)
  }
```

Validate accepts three arguments, the `value` you want to validate, the `Struct` you want the value to match and a `string` or `ValidationOptions`.

The data returned is automatically typed.

Each time you call validate, it will check that the value is valid according to the provided validation `Struct` and throw a json `Response` error with a `statusText` of `'ValidationError'`. You can then handle theses errors in a `CatchBoundary` component.

Alternatively, you can catch these errors and return the `Response` and read them using remix's `useActionData` hook. This is useful if you want to display the errors on a form or elsewhere.

```typescript
  import type { ActionFunction } from "remix"
  import { validate } from "remix-server-kit";
  import { string, nonempty } from "superstruct"

  cosnt NonEmptyString = nonempty(string())

  // check if a value is a non-empty string
  export const action: ActionFunction = async ({request}) => {
    try {
    const formData = await request.formData()
    const name = validate(formData.get("name"), NonEmptyString)
    const description = validate(formData.get("name"), NonEmptyString)}
  } catch(err) {
    if(err instanceof Response && err.statusText === "ValidationError") {
      return err
    }
  }
```

#### validateAsync

```typescript
import type { ActionFunction } from "remix";
import { validateAsync } from "remix-server-kit";
import { string } from "superstruct";

// check if a value is a non-empty string
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // password will be of type `string`
  const name = await validateAsync(formData.get("name"), string())
    .then((name) => {
      console.log(name);
      return name;
    })
    .catch((err) => console.log(err));
};
```

### Resolvers

Resolvers are functions that can be called in your actions and loaders where each time they are called the input is validated against a defined schema.

#### Creating a Resolver

To create a resolver we need to use the `createResolver` function. You will need to provided an object with a `schema` and a `resolve` function.

Example:

```typescript
import { createResolver } from "remix-server-kit";
import { object, string, date } from "superstruct";

const createTask = createResolver({
  schema: object({ name: string(), deadline: date() }),
  resolve({ name, deadline }) {
    return { name, deadline, createdAt: new Date().toISOString() };
  },
});

// call the resolver as any other fuction
const task = createTask({ name: "Wash the dishes", deadline: new Date() });
```

## Adding context to your resolvers

You can reuse logic across resolvers. Each resolver can accept a function that will populate the context variable of the resolver. This means that you can provide context directly form your actions and loaders to the resolver. The context variable will be **typed** automatically.

```typescript
import { createResolver, createContextResolver } from "remix-server-kit";
import { object, string, date } from "superstruct";
import { db } from "~/db.server";

const authContext = createContextResolver({
  resolve() {
    return { userId: number };
  },
});

const createTask = createResolver({
  schema: object({ name: string(), deadline: date() }),
  context: authContext,
  // typeof context = { userId: number }
  async resolve({ name, deadline }, context) {
    const data = {
      userId: context.userId,
      name,
      deadline,
      createdAt: new Date().toISOString(),
    };

    const task = await db.task.createTask(data);

    return task;
  },
});

// call the resolver as any other fuction
const task = createTask({ name: "Wash the dishes", deadline: new Date() });
```

## Error handling

Errors from resolvers are outputted as a `ResolverError` and thrown responses (json, redirects) remain as Response objects.

```ts
type ResolverError = {
  message: string;
  data: T;
  // the original error
  cause: Error | null;
};
```

Each resolver accepts and optional `errorFormatter` function that you can use to modify the shape of `ResolverError.data`.

```ts
const minus = createResolver({
  // errors are thrown if safe mode is false, otherwise a call to minus will return {data?: number, error?: ResolverError<T> }
  safeMode: true,
  async errorFormatter({ validationError, error }) {
    // will return ResolverError<{num1: string, num2: string}>
    return {
      num1: validationError?.data?.find(
        (validationErr) => validationErr.path.join(".") == "numbers.num2"
      )?.message,
      num2: validationError?.data?.find(
        (validationErr) => validationErr.path.join(".") == "numbers.num2"
      )?.message,
    };
  },
  schema: z.object({ numbers: { num1: z.number(), num2: z.number() } }),
  context: authContext,
  // typeof context = { userId: number }
  async resolve({ name, deadline }, context) {},
});

const { data, error } = minus({ numbers: { num1: 200, num2: "200" } });
const num2ErrorMsg = error?.num2;
```

## Matchers

A common pattern in remix to handle multiple forms on a single route is set the `name` attribute of the submit button to `_action` and the `value` attribute to some value which indicates what "action" you want to perform.
Remix Server Kit provides a `createMatcher` function to easily validate the `_action` value and the perform the requested "`_action`".

Example:

```typescript
import { createMatcher } from "remix-server-kit";
import { createTask, deleteTask } from "~/models/tasks.server";
import type { ActionFunction } from "remix";

export const action: ActionFunction = ({ request }) => {
  const formData = await request.formData();

  const matcher = createMatcher({
    create() {
      return createTask();
    },
    delete() {
      return deleteTask({ taskId: formData.get("taskId") });
    },
  });

  const action = matcher.validate(formData.get("_action"));
  const result = await matcher.match(action);

  return result;
};
```
