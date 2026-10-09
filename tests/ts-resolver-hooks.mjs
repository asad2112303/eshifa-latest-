import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const EXTENSIONS = [".ts", ".js", ".mjs"];

export async function resolve(specifier, context, nextResolve) {
  let candidate = specifier;
  if (specifier.startsWith("@/")) candidate = pathToFileURL(path.join(SRC, specifier.slice(2))).href;

  const relative = candidate.startsWith("./") || candidate.startsWith("../") || candidate.startsWith("file:");
  if (relative && !/\.[a-z]+$/i.test(candidate)) {
    const base = candidate.startsWith("file:")
      ? fileURLToPath(candidate)
      : path.resolve(path.dirname(fileURLToPath(context.parentURL)), candidate);
    for (const ext of EXTENSIONS) {
      if (existsSync(base + ext)) return nextResolve(pathToFileURL(base + ext).href, context);
    }
    if (existsSync(path.join(base, "index.ts"))) {
      return nextResolve(pathToFileURL(path.join(base, "index.ts")).href, context);
    }
  }
  return nextResolve(candidate, context);
}
