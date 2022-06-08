import { PipeReturnType } from './../src/types';
import { createPipe, createPipeline, runPipe } from '../src/pipes';
import { object, size, string } from 'superstruct';
import { email } from '../src/validation';
import { json } from '@remix-run/node';

// create a pipe
const createUserPipe = createPipe({
  schema: object({ email: email(), password: size(string(), 4, 100) }),
  resolve({ email, password }) {
    return { id: 1, email, password };
  },
});

// run a pipe
const result = runPipe(
  createUserPipe({
    email: 'test@mail.com',
    password: 'password',
  })
); // result if of type {id: number, email: string, password: string}

// get a pipe's return tyope
type CreateUserPipeResult = PipeReturnType<typeof createUserPipe>;

// create a pipeline
const pipeline: PipeReturnType<typeof createUserPipe> = createPipeline(
  'createUser'
) // the 'createUser' pipe will run
  .action(
    'createUser',
    createUserPipe({
      email: 'test@mail.cim',
      password: 'password',
    })
  )
  .run({
    resolve() {
      return json({});
    },
  });
