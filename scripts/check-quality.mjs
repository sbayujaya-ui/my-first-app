import { spawnSync } from "node:child_process";

const eslint = spawnSync(
  "npx",
  ["eslint", "app", "lib", "utils", "proxy.ts"],
  {
    stdio: "inherit",
    shell: true,
  }
);

if (eslint.status !== 0) {
  console.log("");
  console.log("ESLint menemukan masalah, tetapi pemeriksaan dilanjutkan.");
  console.log("");
}

const build = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
});

process.exit(build.status ?? 1);