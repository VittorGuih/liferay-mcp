#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const PLATFORM_PACKAGES = {
  "win32-x64": "@vittorguih/liferay-mcp-win32-x64",
  "win32-arm64": "@vittorguih/liferay-mcp-win32-arm64",
  "darwin-x64": "@vittorguih/liferay-mcp-darwin-x64",
  "darwin-arm64": "@vittorguih/liferay-mcp-darwin-arm64",
  "linux-x64": "@vittorguih/liferay-mcp-linux-x64",
  "linux-arm64": "@vittorguih/liferay-mcp-linux-arm64"
};

export function platformKey(platform = process.platform, arch = process.arch) {
  return `${platform}-${arch}`;
}

export function platformPackageName(platform = process.platform, arch = process.arch) {
  return PLATFORM_PACKAGES[platformKey(platform, arch)] ?? null;
}

export function resolveBinary({
  platform = process.platform,
  arch = process.arch,
  requireFunc = require
} = {}) {
  const packageName = platformPackageName(platform, arch);
  if (!packageName) {
    throw new Error(`Unsupported platform: ${platform}-${arch}.`);
  }

  let packageJsonPath;
  try {
    packageJsonPath = requireFunc.resolve(`${packageName}/package.json`);
  } catch (error) {
    throw new Error(
      `Missing optional native package "${packageName}". Reinstall liferay-mcp for ${platform}-${arch}.`
    );
  }

  const executable = platform === "win32" ? "liferay-mcp.exe" : "liferay-mcp";
  return join(dirname(packageJsonPath), "bin", executable);
}

export function run(argv = process.argv.slice(2), options = {}) {
  const binary = resolveBinary(options);
  const result = spawnSync(binary, argv, {
    stdio: "inherit",
    env: process.env,
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }
  if (result.signal) {
    process.kill(process.pid, result.signal);
    return;
  }
  process.exit(result.status ?? 0);
}

const isEntrypoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntrypoint) {
  try {
    run();
  } catch (error) {
    console.error(error?.message ?? String(error));
    process.exit(1);
  }
}
