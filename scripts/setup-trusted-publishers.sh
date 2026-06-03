#!/usr/bin/env bash
set -euo pipefail

packages=(
  liferay-mcp-win32-x64
  liferay-mcp-win32-arm64
  liferay-mcp-darwin-x64
  liferay-mcp-darwin-arm64
  liferay-mcp-linux-x64
  liferay-mcp-linux-arm64
)

for package_name in "${packages[@]}"; do
  npx -y npm@11 trust github "$package_name" \
    --repo VittorGuih/liferay-mcp \
    --file publish.yml \
    --allow-publish \
    --yes
done
