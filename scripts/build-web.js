#!/usr/bin/env node
/**
 * 构建 File Viewer 网页版本并复制到桌面项目
 *
 * 用法: node scripts/build-web.js
 *
 * 这个脚本会:
 * 1. 进入 file-viewer monorepo
 * 2. 构建 viewer-demo (Vue 3 完整 demo)
 * 3. 将构建产物复制到 file-viewer-desktop/web/
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const SCRIPT_DIR = __dirname
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const FILE_VIEWER_REPO = path.resolve(PROJECT_ROOT, '..', 'file-viewer')
const WEB_OUTPUT_DIR = path.join(PROJECT_ROOT, 'web')

function log(message) {
  console.log(`[build-web] ${message}`)
}

function error(message) {
  console.error(`[build-web] ERROR: ${message}`)
}

function runCommand(command, cwd) {
  log(`Running: ${command}`)
  log(`In: ${cwd}`)
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env }
  })
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    error(`Source directory does not exist: ${src}`)
    process.exit(1)
  }

  // 清理目标目录
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true })
  }
  fs.mkdirSync(dest, { recursive: true })

  // 复制文件
  function copyRecursive(srcPath, destPath) {
    const entries = fs.readdirSync(srcPath, { withFileTypes: true })
    for (const entry of entries) {
      const srcFile = path.join(srcPath, entry.name)
      const destFile = path.join(destPath, entry.name)
      if (entry.isDirectory()) {
        fs.mkdirSync(destFile, { recursive: true })
        copyRecursive(srcFile, destFile)
      } else {
        fs.copyFileSync(srcFile, destFile)
      }
    }
  }

  copyRecursive(src, dest)
  log(`Copied ${src} -> ${dest}`)
}

function main() {
  log('Starting File Viewer web build...')
  log(`Project root: ${PROJECT_ROOT}`)
  log(`File Viewer repo: ${FILE_VIEWER_REPO}`)
  log(`Web output: ${WEB_OUTPUT_DIR}`)

  // 检查 file-viewer 仓库是否存在
  if (!fs.existsSync(FILE_VIEWER_REPO)) {
    error(`File Viewer repo not found at: ${FILE_VIEWER_REPO}`)
    error('Please clone it first: git clone https://github.com/flyfish-dev/file-viewer.git')
    process.exit(1)
  }

  // 1. 构建核心依赖
  log('Building core packages...')
  try {
    runCommand('pnpm build:core', FILE_VIEWER_REPO)
  } catch (e) {
    error('Failed to build core packages')
    process.exit(1)
  }

  // 2. 构建渲染器
  log('Building renderers...')
  try {
    runCommand('pnpm build:renderers', FILE_VIEWER_REPO)
  } catch (e) {
    error('Failed to build renderers')
    process.exit(1)
  }

  // 3. 构建 capabilities
  log('Building capabilities...')
  try {
    runCommand('pnpm build:capabilities', FILE_VIEWER_REPO)
  } catch (e) {
    error('Failed to build capabilities')
    process.exit(1)
  }

  // 4. 构建 presets
  log('Building presets...')
  try {
    runCommand('pnpm build:presets', FILE_VIEWER_REPO)
  } catch (e) {
    error('Failed to build presets')
    process.exit(1)
  }

  // 5. 构建 components
  log('Building components...')
  try {
    runCommand('pnpm build:components', FILE_VIEWER_REPO)
  } catch (e) {
    error('Failed to build components')
    process.exit(1)
  }

  // 6. 构建 tools (包含资源复制)
  log('Building tools...')
  try {
    runCommand('pnpm build:tools', FILE_VIEWER_REPO)
  } catch (e) {
    error('Failed to build tools')
    process.exit(1)
  }

  // 7. 构建 demo
  log('Building viewer-demo...')
  try {
    runCommand('pnpm build:demo', FILE_VIEWER_REPO)
  } catch (e) {
    error('Failed to build viewer-demo')
    process.exit(1)
  }

  // 8. 复制构建产物
  const demoDist = path.join(FILE_VIEWER_REPO, 'apps', 'viewer-demo', 'dist')
  if (!fs.existsSync(demoDist)) {
    error(`Demo dist not found: ${demoDist}`)
    process.exit(1)
  }

  log('Copying build output...')
  copyDir(demoDist, WEB_OUTPUT_DIR)

  // 9. 验证构建产物
  const indexHtml = path.join(WEB_OUTPUT_DIR, 'index.html')
  if (!fs.existsSync(indexHtml)) {
    error('index.html not found in output!')
    process.exit(1)
  }

  log('='.repeat(60))
  log('Build completed successfully!')
  log(`Web files: ${WEB_OUTPUT_DIR}`)
  log(`index.html: ${indexHtml}`)
  log('')
  log('To test the web version:')
  log(`  1. Open ${indexHtml} in a browser`)
  log('  2. Or run: npm start (to launch Electron)')
  log('='.repeat(60))
}

main()
