export type ResolverFunction<T> = ReturnType<
  T extends (...args: any) => any ? T : () => unknown
>;

export type ResolverReturnType<T> = ReturnType<
  T extends (...args: any) => any
    ? ResolverFunction<T>['resolve']
    : (...args: any) => any
>;
