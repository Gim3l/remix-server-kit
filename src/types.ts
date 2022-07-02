import { Struct } from 'superstruct';
import { ContextResolver } from './resolvers';

export type ResolverFunction<T> = ReturnType<
  T extends (...args: any) => any ? T : () => unknown
>;

export type ResolverReturnType<T> = ReturnType<
  T extends (...args: any) => any
    ? ResolverFunction<T>['resolve']
    : (...args: any) => any
>;

export type ResolverConfig<T, S, _C, R, CR> = {
  input?: T extends object ? Record<keyof T, unknown> : unknown;
  schema?: Struct<T, S>;
  resolveContext?: ContextResolver<CR>;
  resolve: (validatedInput: T extends null ? null : T, ctx: Awaited<CR>) => R;
};
