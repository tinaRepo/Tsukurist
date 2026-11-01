import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bump = process.argv[2];

if (!["patch", "minor", "major"].includes(bump)) {
  console.error("使い方: npm run version:patch | version:minor | version:major");
  process.exit(1);
}

const files = [
  "package.json",
  "package-lock.json",
  "cloudflare/cron-worker/package.json",
  "cloudflare/cron-worker/package-lock.json",
];

const documents = await Promise.all(files.map(async file => {
  const content = await readFile(path.join(root, file), "utf8");
  return { file, content, json: JSON.parse(content) };
}));

const versions = documents.map(({ file, json }) => {
  const version = file.endsWith("package-lock.json")
    ? json.packages?.[""]?.version
    : json.version;
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`${file} に有効な x.y.z 形式のバージョンがありません`);
  }
  return version;
});

if (new Set(versions).size !== 1) {
  throw new Error(`バージョンが一致していません: ${files.map((file, i) => `${file}=${versions[i]}`).join(", ")}`);
}

const [major, minor, patch] = versions[0].split(".").map(Number);
const nextVersion = bump === "major"
  ? `${major + 1}.0.0`
  : bump === "minor"
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;

for (const document of documents) {
  document.json.version = nextVersion;
  if (document.file.endsWith("package-lock.json")) {
    document.json.packages[""].version = nextVersion;
  }
}

await Promise.all(documents.map(({ file, json }) =>
  writeFile(path.join(root, file), `${JSON.stringify(json, null, 2)}\n`, "utf8")
));

console.log(`${versions[0]} → ${nextVersion} (${bump})`);
