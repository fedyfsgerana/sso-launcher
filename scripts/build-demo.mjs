import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const web = `${root}apps/web/src/`;

const modules = [
  ["ov", "app/(portal)/overview/overview.module.css"],
  ["sc", "components/portal/stat-card.module.css"],
  ["as", "components/portal/app-stack.module.css"],
  ["gs", "components/layout/global-search.module.css"],
  ["to", "components/portal/toast.module.css"],
];

function scopeModule(css, prefix) {
  const globals = [];
  const shielded = css.replace(/:global\(([^()]*)\)/g, (_, inner) => {
    globals.push(inner);
    return `\u0000${globals.length - 1}\u0000`;
  });
  const scoped = shielded.replace(/([^{}]+)\{/g, (match, selector) => {
    const head = selector.trim();
    if (head.startsWith("@") || /^(from|to|\d+%)/.test(head)) {
      return match;
    }
    return `${selector.replace(/\.(-?[A-Za-z_][\w-]*)/g, `.${prefix}-$1`)}{`;
  });
  return scoped.replace(/\u0000(\d+)\u0000/g, (_, index) => globals[Number(index)]);
}

const styleDir = `${web}styles/`;
const styleFiles = (await readdir(styleDir)).filter((name) => name.endsWith(".css")).sort();
const globalCss = (await Promise.all(styleFiles.map((name) => readFile(`${styleDir}${name}`, "utf8")))).join("\n");
const moduleCss = (
  await Promise.all(modules.map(async ([prefix, path]) => scopeModule(await readFile(`${web}${path}`, "utf8"), prefix)))
).join("\n");

const logo = (await readFile(`${web}assets/brand/logo.webp`)).toString("base64");
const art = await readFile(`${web}components/auth/login-art.tsx`, "utf8");
const scene = art.match(/const SCENE =\s*'([\s\S]*?)';/)?.[1];

if (!scene) {
  throw new Error("Ilustrasi login tidak ditemukan di login-art.tsx");
}

const template = await readFile(`${root}demo/template.html`, "utf8");

if (!template.includes("/* APP_CSS */")) {
  throw new Error("Penanda /* APP_CSS */ tidak ditemukan di demo/template.html");
}

const html = template
  .replace("/* APP_CSS */", () => `${globalCss}\n${moduleCss}`)
  .replaceAll("{{LOGO}}", () => `data:image/webp;base64,${logo}`)
  .replace("{{SCENE}}", () => JSON.stringify(scene));

await writeFile(`${root}demo/index.html`, html);
console.log(`demo/index.html dibuat dari ${styleFiles.length} file CSS dan ${modules.length} CSS module aplikasi.`);
