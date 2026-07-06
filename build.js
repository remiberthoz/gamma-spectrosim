const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

esbuild.build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  minify: false,
  write: false,
  legalComments: "none",
  sourcemap: false,
}).then(result => {
  const js = result.outputFiles[0].text;

  const css = fs.readFileSync("src/style.css", "utf-8");
  const html = fs.readFileSync("src/index.html", "utf-8");

  const final = html
    .replace('/**css**/', () => css)
    .replace('/**js**/', () => js);

  fs.writeFileSync(path.join(distDir, "index.html"), final);
}).catch(() => process.exit(1));
