import { ContextResolver } from './resolvers';

export const createContextResolver = <T>({
  resolve,
}: {
  resolve: ContextResolver<T>;
}) => {
  return resolve;
};
