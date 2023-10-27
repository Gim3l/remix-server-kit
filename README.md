> ## This project is NO longer maintained.

## Remix Server Kit
Remix server kit provides useful utilities and simplifies validation for actions and loaders.

## Installation

```shell
  npm install remix-server-kit zod
```

## Documentation

### Resolvers

Resolvers are functions that can be called in your actions and loaders where each time they are called the input is validated against a defined schema.

#### Creating a Resolver

To create a resolver we need to use the `createResolver` function. You will need to provided an object with a `schema` and a `resolve` function.

Example:

```typescript
import { createResolver } from "remix-server-kit";
import * as z from "zod";

const createTask = createResolver({
  schema: z.object({ name: z.string(), deadline: z.date() }),
  resolve({ name, deadline }) {
    return { name, deadline, createdAt: new Date().toISOString() };
  },
});

// call the resolver as any other fuction
const { data: task } = createTask({
  name: "Wash the dishes",
  deadline: new Date(),
});
```

Shape of Resolver Result

````typescript
{
  success: true | false,
  info: { name: string, deadline: Date, createdAt: string },
  resolverErr: { message: string, status:number, err: ResolverErr } | null,
  schemaErr: z.ZodErr
}
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
const { data: task } = createTask({
  name: "Wash the dishes",
  deadline: new Date(),
});
````

## Error handling

Errors from resolvers are outputted as a `ResolverError` and thrown responses (json, redirects) remain as Response objects.

Each resolver accepts and optional `errorFormatter` function that you can use to modify the shape of `ResolverError.data`.

```ts
const minus = createResolver({
  // errors are thrown if safe mode is false, otherwise a call to minus will return {data?: number, error?: ResolverError<T> }
  schema: z.object({ numbers: { num1: z.number(), num2: z.number() } }),
  context: authContext,
  async resolve({ name, deadline }, context) {
    throw new ResolverError("Resolver failed!", "FORBIDDEN");
  },
});

const { info, resolverErr } = minus({ numbers: { num1: 200, num2: "200" } });

return json({info}, {status: minus?.resolverErr?.})
```
