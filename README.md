# liferay-mcp

Run the Liferay MCP server with:

```bash
npx -y liferay-mcp
```

The npm package is a small JavaScript wrapper. It installs the native binary for
your platform through optional dependencies and then delegates stdio directly to
that binary.

Required environment:

- `LIFERAY_BASE_URL`
- `LIFERAY_CLIENT_ID`
- `LIFERAY_CLIENT_SECRET`
- `LIFERAY_DEFAULT_GROUP_ID` (optional)
- `LIFERAY_MCP_DRAFTS_DIR` (optional)

Supported native packages:

- `liferay-mcp-win32-x64`
- `liferay-mcp-win32-arm64`
- `liferay-mcp-darwin-x64`
- `liferay-mcp-darwin-arm64`
- `liferay-mcp-linux-x64`
- `liferay-mcp-linux-arm64`
