import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getList } from "~/resolvers/list.server";

export async function loader({ request }: LoaderArgs) {
  const list = await getList({ name: "2" }, { request });

  return json<typeof list>(list);
}
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Remix Server Kit Example</h1>
      <code>{JSON.stringify({ ...loaderData })}</code>
      <p>Error: {!loaderData?.success && loaderData.fail?.message}</p>
    </div>
  );
}
