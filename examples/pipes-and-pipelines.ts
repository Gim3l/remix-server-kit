import { ResolverReturnType } from './../src/types';
import { createResolver, createPipeline, runResolver } from '../src/pipes';
import { object, size, string } from 'superstruct';
import { email } from '../src/validation';
import { json } from '@remix-run/node';

// create a pipe
const createUserResolver = createResolver({
  schema: object({ email: email(), password: size(string(), 4, 100) }),
  resolve({ email, password }) {
    return { id: 1, email, password };
  },
});

// run a pipe
const result = runResolver(
  createUserResolver({
    email: 'test@mail.com',
    password: 'password',
  })
); // result if of type {id: number, email: string, password: string}

// get a pipe's return tyope
type CreateUserRespoverResult = ResolverReturnType<typeof createUserResolver>;

// create a pipeline
const pipeline: ResolverReturnType<typeof createUserResolver> = createPipeline(
  'createUser'
) // the 'createUser' pipe will run
  .action(
    'createUser',
    createUserResolver({
      email: 'test@mail.cim',
      password: 'password',
    })
  )
  .run({
    resolve() {
      return json({});
    },
  });
