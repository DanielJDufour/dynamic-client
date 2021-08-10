import test from "flug";
import { OpenAPIClient } from "./open-api-client.js";

test("creation", async ({ eq }) => {
  const client = new OpenAPIClient({ url: "http://localhost:8000/" });
  await client.init();
  console.log("client:", Object.keys(client));
  eq(Object.keys(client).length > 5, true);
  eq(typeof client.cog.tiles.get, "function");
});

test("example: fetching list of stac assets", async ({ eq }) => {
  const client = new OpenAPIClient({ url: "http://localhost:8000/" });
  await client.init();
  const assets = await client.stac.assets.get({
    url:
      "https://cbers-stac-1-0-0.s3.amazonaws.com/CBERS4/MUX/028/071/CBERS_4_MUX_20190507_028_071_L2.json"
  });
  eq(assets, ["B5", "B6", "B7", "B8"]);
});
