#!/usr/bin/env bash
set -euo pipefail

packages=(
  @vittorguih/liferay-mcp-win32-x64
  @vittorguih/liferay-mcp-win32-arm64
  @vittorguih/liferay-mcp-darwin-x64
  @vittorguih/liferay-mcp-darwin-arm64
  @vittorguih/liferay-mcp-linux-x64
  @vittorguih/liferay-mcp-linux-arm64
)

for package_name in "${packages[@]}"; do
  npx -y npm@11 trust github "$package_name" \
    --repo VittorGuih/liferay-mcp \
    --file publish.yml \
    --allow-publish \
    --yes
done
