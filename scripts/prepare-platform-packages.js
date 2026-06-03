#!/usr/bin/env node
import { chmod, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const root = fileURLToPath(new URL("..", import.meta.url));

const targets = [
  ["win32", "x64", "liferay-mcp-win32-x64", "liferay-mcp.exe"],
  ["win32", "arm64", "liferay-mcp-win32-arm64", "liferay-mcp.exe"],
  ["darwin", "x64", "liferay-mcp-darwin-x64", "liferay-mcp"],
  ["darwin", "arm64", "liferay-mcp-darwin-arm64", "liferay-mcp"],
  ["linux", "x64", "liferay-mcp-linux-x64", "liferay-mcp"],
  ["linux", "arm64", "liferay-mcp-linux-arm64", "liferay-mcp"]
];

const binaryDir = process.env.LIFERAY_MCP_BINARY_DIR;
for (const [platform, arch, packageName, binaryName] of targets) {
  const packageDir = join(root, "packages", packageName);
  const packageJsonPath = join(packageDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  packageJson.version = rootPackage.version;
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

  if (!binaryDir) {
    continue;
  }
  const goArch = arch === "x64" ? "amd64" : arch;
  const sourceName = platform === "win32"
    ? `liferay-mcp_${rootPackage.version}_${platform}_${goArch}.exe`
    : `liferay-mcp_${rootPackage.version}_${platform}_${goArch}`;
  const source = join(binaryDir, sourceName);
  const target = join(packageDir, "bin", binaryName);
  await mkdir(join(packageDir, "bin"), { recursive: true });
  await cp(source, target);
  if (platform !== "win32") {
    await chmod(target, 0o755);
  }
  console.log(`Prepared ${packageName} from ${basename(source)}`);
}
