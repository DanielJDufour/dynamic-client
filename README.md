# dynamic-client
Dynamic JavaScript Client for APIs that have an OpenAPI Definition.  Emphasis on Easy Navigation of API Paths.

# features
- Easy Endpoint Navigation
- Automatic Path Grouping
- Cross-Platform

# install
```bash
npm install dynamic-client
```

# usage
```js
import { DynamicClient } from 'dynamic-client';

const client = new DynamicClient({
  url: "https://example.org/api",

  // optional debug level
  // set higher number for more logging
  debugLevel: 1,
});

// fetch api definition file and initialize tree structure
await client.init();
```
client will looks something like this
```js
{
  _base: "https://example.org/api",
  _debug_level: 1,
  cog: {
    assets: {
      // sends a GET request to https://example.org/api/cog/assets
      get: function({ }) { ... }
    },
    tiles: {
      // sends a GET request to https://example.org/api/cog/tiles with the provided parameters (x, y, z, and url)
      // the function will automatically place the parameters in the url path or as query params
      // depending on the OpenAPI Definition
      get: function({ x, y, z, url }) { ... }
    }
  },
}
```
and here's a sample request to the `/cog/tiles/{z}/{x}/{y}?url={url}` endpoint
```js
const result = await client.cog.tiles.get({ z: 8, x: 12, y: 4, url: "https://example.org/data/test.tif" });
// result is an array buffer
```
