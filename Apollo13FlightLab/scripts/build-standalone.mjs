import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { Script } from "node:vm";
const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
const assets = {};
for (const name of [
  "land.geojson",
  "agc/LM131R1.bin",
  "agc/Manche72R3.bin",
  "agc/yaAGC.wasm",
  "agc/LM131R1-source.json",
  "agc/Manche72R3-source.json",
]) {
  const type =
    name.endsWith(".json") || name.endsWith(".geojson")
      ? "application/json"
      : name.endsWith(".wasm")
        ? "application/wasm"
        : "application/octet-stream";
  assets[name] =
    `data:${type};base64,${(await fs.readFile("public/" + name)).toString("base64")}`;
}
const result = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  write: false,
  format: "iife",
  target: "es2022",
  minify: true,
  legalComments: "inline",
  define: {
    __APOLLO_ASSETS__: JSON.stringify(assets),
    "import.meta.env.BASE_URL": '"./"',
  },
  plugins: [
    {
      name: "inline-css-separately",
      setup(build) {
        build.onLoad({ filter: /\.css$/ }, () => ({
          contents: "",
          loader: "js",
        }));
      },
    },
  ],
});
let css = await fs.readFile("src/style.css", "utf8");
for (const name of await fs.readdir("public/fonts"))
  if (name.endsWith(".ttf"))
    css = css.replaceAll(
      "../public/fonts/" + name,
      `data:font/ttf;base64,${(await fs.readFile("public/fonts/" + name)).toString("base64")}`,
    );
const js = result.outputFiles[0].text.replaceAll("</script", "<\\/script");
let html = await fs.readFile("index.html", "utf8");
html = html
  .replace("</head>", `<style>${css}</style></head>`)
  .replace(
    '<script type="module" src="/src/main.js"></script>',
    () =>
      `<!-- GPL-2.0-or-later. Complete corresponding source is supplied with this distribution. -->\n<script>${js}</script>`,
  );
new Script(js);
if (
  (html.match(/<script[ >]/g) ?? []).length !== 1 ||
  html.includes('src="/src/main.js"')
)
  throw Error("Standalone script embedding failed");
await fs.mkdir("release", { recursive: true });
await fs.writeFile("release/Apollo13-Flight-Lab.html", html);
console.log(
  `Offline HTML: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB. All fonts, map, source files, ropes and WASM embedded.`,
);
