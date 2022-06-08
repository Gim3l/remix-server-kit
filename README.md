## Remix Server Kit

THIS IS STILL IN A ALPHA STAGE AND NOT SUITABLE FOR PRODUCTION (v1 coming soon)

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

#### Validator

```typescript
  import type { ActionFunction } from "remix"
  import { validateAsync  } from "remix-server-kit";
  import { string, size } from "superstruct"

  const validator = validatePassword = (myString: string) => new Validator(myString, size(string(), 4, 8), "password").execute()

  // check if a value is a non-empty string
  export const action: ActionFunction = async ({request}) => {
    const formData = await request.formData()

    // password will be of type `string`
    const password = validatePassword(formData.password)
  }
```

If the validation fails it will throw a `Response` object, with a status code of `400` (the status code can be customised).

### ActionPipelines

A common pattern in remix to handle multiple forms on a single route is add a button element and set the `name` to `_action` and the `value` to indicate what "action" you want to perform, then read the value within.

Remix Server Kit provides a simple API you can use to not have constantly check what the value of `_action` is and to execute the required action with `validation` and `context` support.

#### Example:

```typescript
  import { changeTaskStatus, deleteTask } from "~/models/tasks"
  import type { ActionFunction } from "remix"
  import { validateAsync  } from "remix-server-kit";
  import { string, size, nonempty } from "superstruct"

    // check if a value is a non-empty string
  export const action: ActionFunction = async ({request}) => {
    const formData = await request.formData()
    const action = validate(formData.get("action"), string())

    const pipeline = new ActionPipeline(action)
    .action("deleteTodo",
    {
      validator: new Validator(formData.get("todoId"), nonempty(string())),
      // todoId will be of type `string`
      async resolve(todoId) {
        return deleteTodo(todoId)
      }
    })
    .action("changeTaskStatus",
    {
      validator: new Validator({
        todoId: formData.get("todoId")
        // superstruct allows us to transform the input, 'completed' will be of type 'boolean'
        completed: formData.get("completed")
      }, object({
          todoId: string(),
          completed: coerce(boolean(), string(), (value) => value === "true")
        })),
      async resolve({ todoId, completed }) {
        return changeTodoStatus(todoId, completed)
      }
    })
    .run({
      // you need to provided a fallback action if none matches, each remix action must return a response
      resolve() {
        return json({}, { status: 500 });
      },
    })

    return pipeline
  }
```

When you define an action a key is necessary which is matched
Returning a `pipeline` will return the validation error to the client which you can use to display errors on forms.

### Types

`ValidationOptions`

```
export type ValidateOptions = {
  key?: string;
  status?: number;
  errorKey?: string;
  defaultError?: boolean;
  messages?: Record<string, string | ((error: Failure) => string)>;
};
```

#### Inspired By

- tRPC
- superstruct
