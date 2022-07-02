import { ContextResolver } from './types';

export const createContextResolver = <T>({
  resolve,
}: {
  resolve: ContextResolver<T>;
}) => {
  return resolve;
};
