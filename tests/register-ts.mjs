// Lets `node --test` import the TypeScript sources directly.
//
// Node strips type annotations itself; what it cannot do is resolve the "@/"
// path alias or extensionless relative imports the way the Next bundler does.
// The hook in ts-resolver-hooks.mjs fills that gap for test runs only.
import { register } from "node:module";

register("./ts-resolver-hooks.mjs", import.meta.url);
