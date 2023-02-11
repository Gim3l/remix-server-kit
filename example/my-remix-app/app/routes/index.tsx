import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getList, sendMessage } from "~/resolvers/list.server";

export async function loader({ request }: LoaderArgs) {
  const list = await getList(
    {
      name: "error",
      age: 20,
    },
    { input: "sdf" }
  );

  if (list.resolverErr) {
    console.log(list.resolverErr.err);
  }

  return json(
    {
      list,
    },
    {
      status: list.resolverErr?.status || 200,
    }
  );
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  const result = await sendMessage({
    message: formData.get("message"),
    name: formData.get("name"),
  });

  return json(result, {
    status: result.resolverErr?.status || 200,
  });
}

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      {fetcher.data?.success && fetcher.data.info?.name}
      <button
        onClick={() =>
          fetcher.submit(
            { name: "test", message: "cooler" },
            { method: "post" }
          )
        }
      >
        Remote submit
      </button>
      <fetcher.Form method="post">
        <div>
          <label htmlFor="name">Name</label>
          <input
            name="name"
            type="text"
            style={{
              border:
                !fetcher.data?.success &&
                fetcher.data?.schemaErr?.fieldErrors?.name
                  ? "1px solid red"
                  : undefined,
            }}
          />
          {!fetcher.data?.success && (
            <p style={{ color: "red" }}>
              {fetcher.data?.schemaErr?.fieldErrors?.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="message">Message</label>

          <input
            name="message"
            type="text"
            // error style
            style={{
              border:
                !fetcher.data?.success &&
                fetcher.data?.schemaErr?.fieldErrors?.message
                  ? "1px solid red"
                  : undefined,
            }}
          />
          {!fetcher.data?.success && (
            <p style={{ color: "red" }}>
              {fetcher.data?.schemaErr?.fieldErrors?.message}
            </p>
          )}
        </div>
        <button>Submit</button>
        {JSON.stringify(fetcher.data)}
      </fetcher.Form>
    </div>
  );
}
