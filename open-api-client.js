import axios from "axios";

const RE_PATH_VAR = /{[^}]+}/g;

export class OpenAPIClient {
  constructor({ debugLevel = 0, url }) {
    // remove trailing slash
    this._base = url.replace(/\/$/, "");
    this._debug_level = debugLevel;
  }

  async init() {
    const definitionUrl = this._base.replace(/\/$/, "") + "/openapi.json";
    if (this.debug_level >= 1)
      console.log("[open-api-client] definitionUrl:", definitionUrl);

    const { data: definition } = await axios.get(definitionUrl);
    if (this.debug_level >= 2)
      console.log("[open-api-client] definition:", definition);

    const groups = {};
    Object.entries(definition.paths).forEach(([path, methods]) => {
      const parts = path
        .split("/")
        .map(part => {
          return part
            .split(RE_PATH_VAR) // split on variables, in effect removing them
            .filter(sub => sub.length >= 3) // remove any extra things like @ , and . between variables
            .map(sub => sub.replace(/\.$/, "")) // remove any trailing .
            .join(""); // assume only one substantive part between / ... /
        })
        .filter(it => it.length > 0);

      if (this.debug_level >= 3) console.log("[open-api-client] parts:", parts);

      const key = JSON.stringify(parts);
      if (key in groups) groups[key].push({ path, methods });
      else groups[key] = [{ path, methods }];
    });
    if (this.debug_level >= 2) console.log("[open-api-client] groups:", groups);

    // add groups to API Client
    Object.entries(groups).forEach(([key, grp]) => {
      const parts = JSON.parse(key);
      let obj = this;
      parts.forEach(str => {
        if (!(str in obj)) obj[str] = {};
        obj = obj[str];
      });

      const methods = Array.from(
        new Set(grp.map(it => Object.keys(it.methods)).flat())
      );

      methods.forEach(method => {
        obj[method] = params => {
          const endpoint = grp.find(subgroup => {
            const subGroupParams = subgroup.methods[method].parameters;
            const paramNames = subGroupParams.map(it => it.name);
            const requiredParams = subGroupParams
              .filter(it => it.required)
              .map(it => it.name);

            // check if params cover all subgroup params
            if (!requiredParams.every(req => req in params)) return false;

            // check if all params given are available
            if (!Object.keys(params).every(name => paramNames.includes(name)))
              return false;

            return true;
          });

          const { path } = endpoint;

          const callparams = endpoint.methods[method].parameters;
          let url = path;
          let query = new URLSearchParams();
          Object.entries(params).forEach(([k, v]) => {
            const param = callparams.find(
              param => param.name.toLowerCase() === k.toLowerCase()
            );
            if (param.in === "path")
              url = url.replace("{" + param.name + "}", v);
            else if (param.in === "query") query.append(k, v);
            else
              throw new Error(
                '[open-api-client] unsupported "in" value:',
                param
              );
            // need to add support for post
          });
          url = this._base + url + "?" + query.toString();

          if (this.debug_level >= 2) console.log("[open-api-client] url:", url);

          return axios[method](url).then(res => res.data);
        };
      });
    });
  }
}
