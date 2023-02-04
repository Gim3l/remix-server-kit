import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getList } from "~/resolvers/list.server";

export async function loader({ request }: LoaderArgs) {
  const list = await getList({ name: "error" as any }, { request });

  return json<typeof list>(list, { status: list.status });
}
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <button
        onClick={() => {
          setCount((prev) => prev + 1);
        }}
      >
        Count
      </button>
      <h1>Remix Server Kit Example</h1>
      <code>{JSON.stringify({ ...loaderData })}</code>
      <div>{loaderData?.success ? <>Status: success</> : null}</div>
      <div>
        {!loaderData?.success ? (
          <>
            <p>Schema Errors:</p>
            <ul>
              {loaderData.schemaErrors?.errors?.map((error) => (
                <li key={error.message}>{error.message}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {/* <p>Error: {!loaderData?.success && loaderData.fail?.message}</p> */}
    </div>
  );
}
