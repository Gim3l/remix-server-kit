export type ResolverFunction<T> = ReturnType<
  T extends (...args: any) => any ? T : () => unknown
>;

export type ResolverReturnType<T> = ReturnType<
  T extends (...args: any) => any
    ? ResolverFunction<T>['resolve']
    : (...args: any) => any
>;

// export necessary atm, project wont compile otherwise
export type AwaitedPromise<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
  ? F extends (value: infer V, ...args: any) => any // if the argument to `then` is callable, extracts the first argument
    ? Awaited<V> // recursively unwrap the value
    : never // the argument to `then` was not callable
  : T;
