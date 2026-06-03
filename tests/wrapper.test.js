import assert from "node:assert/strict";
import { test } from "node:test";
import {
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
