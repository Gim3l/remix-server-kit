import { createContextResolver } from './../src/context';
import { json } from '@remix-run/node';
import { array, number, string } from 'superstruct';
import { createMatcher, createResolver } from './../src/resolvers';

const addCtxResolver = createContextResolver({
  resolve: () => {
    return 'hello';
  },
});

const add = createResolver({
  schema: array(number()),
  resolveContext: addCtxResolver,
  resolve(values, ctx) {
    return values.reduce((acc, value) => acc + value, 0);
  },
});

const sayHello = createResolver({
  schema: string(),
  resolve(text) {
    return 'hello ' + text;
  },
});

let key = 'sayHello';

const matcher = createMatcher({
  sayHello: () => {
    const result = sayHello('world');
    return result;
  },
  add: () => add([20, 30, 50]),
  addMore: () => add([20]),
  default: () => {
    return {};
  },
});

const result = matcher.match('sayHello');

// const addMore: InferMatcherReturnType<typeof matcher, 'addMore'>;
// console.log(addMore);
