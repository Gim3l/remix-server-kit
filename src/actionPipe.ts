import type { Validator } from "./validation";

type PipelineData<T, S, C> = {
  validator?: Validator<T, S>;
  resolve: (
    input: T extends null ? null : T,
    ctx: C extends null ? null : C
  ) => unknown;
};

export class ActionPipeline<CTX> {
  private actions: any = {};
  private match: string;
  private context?: CTX;

  constructor(match: string = "default", context?: CTX) {
    this.match = match;
    this.context = context;
  }

  action<T, S>(key: string | string[], pipeline: PipelineData<T, S, CTX>) {
    const actionFunction = ({ throwOnError }: { throwOnError: boolean }) => {
      try {
        const input = pipeline["validator"]?.execute();
        const resolve = pipeline["resolve"];

        return resolve(input as any, this.context as any);
      } catch (err) {
        if (err instanceof Response) {
          if (err.statusText === "ValidationError") {
            if (throwOnError) throw err;
            return err;
          }
        }
      }
    };

    if (typeof key === "string") {
      this.actions[key] = actionFunction;
    } else {
      key.forEach((key) => {
        this.actions[key] = actionFunction;
      });
    }

    return this;
  }

  run<T, S>(pipeline: PipelineData<T, S, CTX>) {
    this.action("fallback", pipeline);

    const resolvedAction = this.actions[this.match] || this.actions["fallback"];

    return resolvedAction({ throwOnError: false });
  }
}
