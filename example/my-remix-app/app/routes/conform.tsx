import { conform, parse, useForm } from "@conform-to/react";
import { formatError } from "@conform-to/zod";
import { type ActionArgs, json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import type { z } from "zod";
import type { sendMessageSchema } from "~/resolvers/list.server";
import { sendMessage } from "~/resolvers/list.server";

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData);

  const post = await sendMessage(
    {
      message: submission.value.message,
      name: submission.value.name,
    },
    { submission }
  );

  if (post.schemaErr) {
    submission.error.push(...formatError(post.schemaErr));
  }

  return json(
    {
      post,
      submission,
    },
    {
      status: 400,
    }
  );
}

export default function LoginForm() {
  const fetcher = useFetcher<typeof action>();

  // The useForm hook will return everything you need to setup a form
  // including the error and config of each field
  const [form, { message, name }] = useForm<z.infer<typeof sendMessageSchema>>({
    initialReport: "onBlur",
    mode: "server-validation",
    state: fetcher?.data?.submission,
    constraint: { name: { required: true, minLength: 12, min: 12 } },
    defaultValue: {
      // name: "test@mail.com",
    },
  });

  return (
    <fetcher.Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input
          required
          defaultValue={name.config.defaultValue as string}
          {...(conform.input(name.config), { name: "name" })}
          // defaultValue={email.config.defaultValue}
        />
        <div>{name.error}</div>
      </div>
      <div>
        <label>Password</label>
        <input name="message" />
        <div>{message.error}</div>
      </div>
      <button type="submit">Login</button>

      {JSON.stringify({ submission: fetcher?.data })}
    </fetcher.Form>
  );
}
