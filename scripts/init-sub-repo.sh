#!/usr/bin/env bash
# init-sub-repo.sh —— 从 master 创建新的子仓
#
# 用法：
#   ./scripts/init-sub-repo.sh <github-user> <repo-name> [site-name]
#
# 例子：
#   ./scripts/init-sub-repo.sh Omlandc my-cooking-blog "My Cooking Blog"
#
# 流程：
#   1. 用 GitHub API 创建空仓（private: false）
#   2. git archive 导出 master 当前 HEAD
#   3. 修改 vite.config.ts base 为 /<repo-name>/
#   4. 修改 package.json name + description
#   5. 修改 site-config 默认 name
#   6. 加 .env.production（VITE_PUBLIC_ONLY=true）
#   7. 加 .github/workflows/deploy.yml（vite build + actions/deploy-pages）
#   8. push 到 main → GitHub Pages 自动部署
#
# 后续：
#   - 子仓会自动收到 master 推送的内容（通过 flush-queue.mjs）
#   - 想升级基础代码：在主仓执行 ./scripts/sync-base-code.sh <user> <repo>

set -euo pipefail

REPO_OWNER="${1:?Usage: $0 <owner> <repo> [site-name]}"
REPO_NAME="${2:?Usage: $0 <owner> <repo> [site-name]}"
SITE_NAME="${3:-$REPO_NAME}"

GITHUB_TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN env var required"
  exit 1
fi

REPO_FULL="$REPO_OWNER/$REPO_NAME"
BASE_PATH="/$REPO_NAME/"

echo "🚀 Initializing sub-repo $REPO_FULL"
echo "   site name: $SITE_NAME"
echo "   base path: $BASE_PATH"

# 1. 创建空仓
echo "📦 Creating GitHub repo..."
curl -sf -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user/repos" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"由 blog-system 总控台管理 · $SITE_NAME\",\"private\":false,\"auto_init\":true}" \
  | jq '{name, html_url, message}' 2>&1 | head -3
echo ""

# 2. 临时目录操作
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT
cd "$TMPDIR"

echo "📥 Cloning master source..."
git archive --format=tar HEAD | tar -x
# 删 master-only 文件
rm -f sites.yaml data/pending-pushes.json data/history scripts/flush-queue.mjs
rm -rf .github/workflows/flush-content.yml tsconfig.tsbuildinfo

# 3. 改 vite.config.ts base
sed -i "s|base:.*|base: '$BASE_PATH',|" vite.config.ts || {
  # 没有 base 行就在 plugins 前面插
  sed -i "s|plugins: \[react()\]|base: '$BASE_PATH',\n  plugins: [react()]|" vite.config.ts
  sed -i "s|import { blogSyncPlugin } from './vite-plugins/blog-sync';|import { blogSyncPlugin } from './vite-plugins/blog-sync';\nimport { siteMetaPlugin } from './vite-plugins/site-meta';|" vite.config.ts
  sed -i "s|plugins: \[react(), blogSyncPlugin()\]|plugins: [react(), blogSyncPlugin(), siteMetaPlugin()]|" vite.config.ts
}

# 4. 改 package.json
sed -i "s|\"name\": \"blog-system\"|\"name\": \"$REPO_NAME\"|" package.json
sed -i "s|\"description\": \"A production-grade blog & article creation system\"|\"description\": \"由 blog-system 总控台管理 · $SITE_NAME\"|" package.json

# 5. 改 site-config
python3 << PYEOF
import re
path = 'src/lib/site-config/index.tsx'
with open(path) as f:
    content = f.read()
content = content.replace(
    "name: '博客系统',\n  tagline: '一套可复用的细分内容站框架',",
    f"name: '$SITE_NAME',\n  tagline: '由 blog-system 总控台管理',",
)
content = content.replace(
    "description: '基于 React 18 + TypeScript + Vite 的开源博客与文章创作系统。',",
    f"description: '$SITE_NAME 是 blog-system 总控台管理的子仓。所有内容由主仓推送。',",
)
with open(path, 'w') as f:
    f.write(content)
PYEOF

# 6. 加 .env.production
cat > .env.production << EOF
VITE_PUBLIC_ONLY=true
VITE_MASTER_URL=https://github.com/Omlandc/blog-system
VITE_SHOW_POWERED_BY=true
EOF

# 7. 加 GitHub Pages deploy workflow
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'DEPLOY_EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Build
        run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
DEPLOY_EOF

# .nojekyll（避免 Jekyll 干扰 SPA 路由）
touch .nojekyll

# README
cat > README.md << EOF
# $REPO_NAME

由 **blog-system** 总控台管理的子仓

- 总控台：https://github.com/Omlandc/blog-system
- 站点：https://$REPO_OWNER.github.io/$REPO_NAME/

## 子仓模式

\`VITE_PUBLIC_ONLY=true\` 启用：
- 不含后台路由和登录入口
- footer 显示 "由 blog-system 管理"

## 自动同步

内容由主仓 \`data/pending-pushes.json\` 队列推送。基础代码手动同步（见主仓 \`scripts/sync-base-code.sh\`）。

## 本地开发

\`\`\`bash
npm install
npm run dev
\`\`\`
EOF

# 8. 提交并推送
echo "🚀 Pushing to $REPO_FULL..."
git init -q
git config user.name "blog-system-bot"
git config user.email "bot@blog-system.local"
git add -A
git commit -q -m "chore: initialize sub-repo from blog-system master"
git remote add origin "https://$GITHUB_TOKEN@github.com/$REPO_FULL.git"
git branch -M main
git push -u origin main --force

# 9. 启用 GitHub Pages
echo "🌐 Enabling GitHub Pages..."
curl -sf -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO_FULL/pages" \
  -d '{"build_type":"workflow","source":{"branch":"main","path":"/"}}' \
  | jq '.' 2>&1 | head -10

echo ""
echo "✅ Sub-repo $REPO_FULL initialized!"
echo "   - Repo: https://github.com/$REPO_FULL"
echo "   - Pages: https://$REPO_OWNER.github.io/$REPO_NAME/"
echo ""
echo "📝 Next steps:"
echo "   1. Add to master sites.yaml:"
echo "      - id: $REPO_NAME"
echo "        repo: $REPO_FULL"
echo "        branch: main"
echo "        base_path: $BASE_PATH"
echo "        enabled: true"
echo "   2. Push content via data/pending-pushes.json"