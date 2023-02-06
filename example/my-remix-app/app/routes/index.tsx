import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getList } from "~/resolvers/list.server";

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

      {loaderData?.list.success ? (
        <>All good!</>
      ) : (
        <p>Resolver Error: {loaderData.list.resolverErr?.message} </p>
      )}

      {loaderData.list.success}
      <code>{JSON.stringify({ ...loaderData })}</code>
      <div>{loaderData.list?.success ? <>Status: success</> : null}</div>
      {loaderData.list.success ? loaderData.list.info.name : null}
      {loaderData.list?.success ? loaderData.list?.info?.age : null}
      {loaderData.list?.success ? loaderData.list?.info?.userId : null}
      <div>
        {!loaderData.list?.success ? (
          <>
            <p>Name Error: {loaderData.list.schemaErr?.name?._errors[0]}</p>
            <p>Schema Errors:</p>
            {/* {loaderData.list.schemaErrors?.map((error) => (
              <li key={error.message}>{error.message}</li>
            ))} */}
          </>
        ) : null}
      </div>
      {/* <p>Error: {!loaderData?.success && loaderData.fail?.message}</p> */}
    </div>
  );
}
