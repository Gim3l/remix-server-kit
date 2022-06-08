import { json } from "@remix-run/node";
import type { Struct } from "superstruct";
import { any } from "superstruct";
import { validate } from "./validation";

export type PipelineData<T, S, C, R> = {
  input?: T extends object ? Record<keyof T, unknown> : unknown;
  schema?: Struct<T, S>;
  resolve: (
    validatedInput: T extends null ? null : T,
    ctx: C extends null ? null : C
  ) => R;
};

export class ActionPipeline<CTX> {
  private actions: any = {};
  private match: string;
  private context?: CTX;
  private options?: { throwOnError: boolean };

  constructor(
    match: string = "default",
    context?: CTX,
    options?: { throwOnError: boolean }
  ) {
    this.match = match;
    this.context = context;
    this.options = options;
  }

  action<T, S, CTX, R>(
    key: string | string[],
    pipe: PipelineData<T, S, CTX, R>
  ) {
    const actionsResolver = ({ throwOnError }: { throwOnError: boolean }) => {
      try {
        const input = pipe["input"];
        const schema = pipe["schema"]!;
        const resolve = pipe["resolve"];

        validate(input as any, schema || any());

        return resolve(input as any, this.context as any);
      } catch (err) {
        if (err instanceof Response) {
          if (err.statusText === "ValidationError") {
            if (throwOnError) throw err;
            return err;
          }
        }

        throw err;
      }
    };

    // add pipe resolver to actions object so we can access them by key later
    if (typeof key === "string") {
      this.actions[key] = actionsResolver;
    } else {
      key.forEach((key) => {
        this.actions[key] = actionsResolver;
      });
    }

    return this;
  }

  async run<T, S, CTX, R>(pipe: PipelineData<T, S, CTX, R>) {
    this.action<T, S, CTX, R>("fallback", pipe);

    const resolvedAction = this.actions[this.match] || this.actions["fallback"];
    let resolvedActionData = await resolvedAction({
      throwOnError: this.options?.throwOnError,
    });

    console.log({ resolvedActionData });

    if (this.actions[this.match] && !resolvedActionData) {
      console.log("YEAH");
      return this.actions.fallback({
        throwOnError: this.options?.throwOnError,
      });
    }

    return resolvedActionData;
  }
}

/** Create a pipe */
export const createPipe = <T, S, C, R>(
  pipeConfig: Pick<PipelineData<T, S, C, R>, "resolve" | "schema">
): ((
  args: T extends object ? Record<keyof T, unknown> : unknown
) => PipelineData<T, S, C, R>) => {
  const { resolve, schema } = pipeConfig;

  return (args: T extends object ? Record<keyof T, unknown> : unknown) => ({
    input: args,
    resolve,
    schema,
  });
};

/** Create a pipeline to run pipes conditionally */
export const createPipeline = (
  ...args: ConstructorParameters<typeof ActionPipeline>
) => new ActionPipeline(args[0], args[1], { throwOnError: true });

export const runPipe = async <T, S, CTX, R>(
  pipe: PipelineData<T, S, CTX, R>
): Promise<R> => {
  return await createPipeline("default")
    .action("default", pipe)
    .run({
      resolve() {
        return json({});
      },
    });
};
