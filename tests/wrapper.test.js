import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  isEntrypoint,
  platformKey,
  platformPackageName,
  resolveBinary
} from "../bin/liferay-mcp.js";

test("maps supported platform packages", () => {
  assert.equal(platformKey("win32", "x64"), "win32-x64");
  assert.equal(platformPackageName("win32", "x64"), "@vittorguih/liferay-mcp-win32-x64");
  assert.equal(platformPackageName("darwin", "arm64"), "@vittorguih/liferay-mcp-darwin-arm64");
  assert.equal(platformPackageName("linux", "arm64"), "@vittorguih/liferay-mcp-linux-arm64");
  assert.equal(platformPackageName("freebsd", "x64"), null);
});

test("resolves binary path from optional dependency package.json", () => {
  const requireFunc = {
    resolve(specifier) {
      assert.equal(specifier, "@vittorguih/liferay-mcp-win32-x64/package.json");
      return "/repo/node_modules/@vittorguih/liferay-mcp-win32-x64/package.json";
    }
  };

  assert.equal(
    resolveBinary({ platform: "win32", arch: "x64", requireFunc }).replaceAll("\\", "/"),
    "/repo/node_modules/@vittorguih/liferay-mcp-win32-x64/bin/liferay-mcp.exe"
  );
});

test("reports missing optional package clearly", () => {
  const requireFunc = {
    resolve() {
      throw new Error("Cannot find module");
    }
  };

  assert.throws(
    () => resolveBinary({ platform: "linux", arch: "x64", requireFunc }),
    /Missing optional native package "@vittorguih\/liferay-mcp-linux-x64"/
  );
});

test("detects entrypoint through npm .bin symlink", () => {
  const target = new URL("../bin/liferay-mcp.js", import.meta.url);
  const dir = mkdtempSync(join(tmpdir(), "liferay-mcp-bin-"));
  const link = join(dir, "liferay-mcp");
  symlinkSync(target, link);

  assert.equal(isEntrypoint(target.href, link), true);
});

test("runs native binary when invoked through npm .bin symlink", { skip: process.platform === "win32" }, () => {
  const packageName = platformPackageName();
  if (!packageName) {
    assert.fail(`unsupported test platform ${process.platform}-${process.arch}`);
  }

  const root = mkdtempSync(join(tmpdir(), "liferay-mcp-install-"));
  const wrapperDir = join(root, "node_modules", "liferay-mcp", "bin");
  const binDir = join(root, "node_modules", ".bin");
  const [scope, nativeName] = packageName.split("/");
  const nativeDir = join(root, "node_modules", scope, nativeName);
  const nativeBinDir = join(nativeDir, "bin");

  mkdirSync(wrapperDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  mkdirSync(nativeBinDir, { recursive: true });

  const wrapperPath = join(wrapperDir, "liferay-mcp.js");
  copyFileSync(new URL("../bin/liferay-mcp.js", import.meta.url), wrapperPath);
  writeFileSync(
    join(root, "node_modules", "liferay-mcp", "package.json"),
    JSON.stringify({ name: "liferay-mcp", version: "0.0.0", type: "module" })
  );

  writeFileSync(
    join(nativeDir, "package.json"),
    JSON.stringify({ name: packageName, version: "0.0.0", type: "module" })
  );

  const nativeBinary = join(nativeBinDir, "liferay-mcp");
  writeFileSync(
    nativeBinary,
    [
      "#!/usr/bin/env node",
      "let input = '';",
      "process.stdin.setEncoding('utf8');",
      "process.stdin.on('data', chunk => { input += chunk; });",
      "process.stdin.on('end', () => {",
      "  console.log(JSON.stringify({ argv: process.argv.slice(2), input: input.trim() }));",
      "});",
      ""
    ].join("\n")
  );
  chmodSync(nativeBinary, 0o755);

  const link = join(binDir, "liferay-mcp");
  symlinkSync(wrapperPath, link);

  const result = spawnSync(link, ["--probe"], {
    encoding: "utf8",
    input: "stdin-ok\n"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    argv: ["--probe"],
    input: "stdin-ok"
  });
});
