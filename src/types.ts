export type PipeFunction<T> = ReturnType<
  T extends (...args: any) => any ? T : () => unknown
>;

export type PipeReturnType<T> = ReturnType<
  T extends (...args: any) => any
    ? PipeFunction<T>['resolve']
    : (...args: any) => any
>;
