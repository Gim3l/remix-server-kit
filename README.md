## Remix Server Kit

Remix server kit provides useful utilities and simplifies validation for actions and loaders.

## Installation

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
  import type { ActionFunction } from "remix"
  import { validateAsync } from "remix-server-kit";
  import { string } from "superstruct"

  // check if a value is a non-empty string
  export const action: ActionFunction = async ({request}) => {
    const formData = await request.formData()

    // password will be of type `string`
    const name = await validateAsync(formData.get("name"), string())
    .then(name => {
      console.log(name)
      return name
    })
    .catch(err => console.log(err))
  }
```

### Resolvers

Resolvers are functions that can be called in your actions and loaders where each time they are called the input is validated against a defined schema.

#### Creating a Resolver

To create a resolver we need to use the `createResolver` function. You will need to provided an object with a `schema` and a `resolve` function.

Example:

```typescript
import { createResolver } from 'remix-server-kit';
import { object, string, date } from 'superstruct';

const createTask = createResolver({
  schema: object({ name: string(), deadline: date() }),
  resolve(name, deadline) {
    return { name, deadline, createdAt: new Date().toISOString() };
  },
});

// call the resolver as any other fuction
const task = createTask({ name: 'Wash the dishes', deadline: new Date() });
```

### Matchers

A common pattern in remix to handle multiple forms on a single route is set the `name` attribute of the submit button to `_action` and the `value` attribute to some value which indicates what "action" you want to perform.
Remix Server Kit provides a `createMatcher` function to easily validate the `_action` value and the perform the requested "`_action`".

Example:

```typescript
import { createMatcher } from 'remix-server-kit';
import { createTask, deleteTask } from '~/models/tasks.server';
import type { ActionFunction } from "remix";

export const action: ActionFunction = ({ request }) => {
  const formData = await request.formData()

  const matcher = createMatcher({
    create() {
      return createTask();
    },
    delete() {
      return deleteTask({ taskId: formData.get("taskId") });
    }
  })

  const action = matcher.validate(formData.get("_action"))
  const result = await matcher.match(action)


  return result
}

```
