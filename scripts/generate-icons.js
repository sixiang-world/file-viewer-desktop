#!/usr/bin/env node
/**
 * 生成应用图标
 * 使用简单的 SVG 生成 PNG 图标，然后转换为 ICO
 *
 * 如果没有 imagemagick，会生成一个简单的占位图标
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SCRIPT_DIR = __dirname
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const BUILD_DIR = path.join(PROJECT_ROOT, 'build')
const ICONS_DIR = path.join(BUILD_DIR, 'icons')

function log(message) {
  console.log(`[icons] ${message}`)
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 生成简单的 SVG 图标
function generateIconSvg(color, label, bgColor = '#1f966e') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d7a55;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="48" fill="url(#grad)"/>
  <text x="128" y="128" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${label}</text>
  <rect x="60" y="160" width="136" height="12" rx="6" fill="rgba(255,255,255,0.3)"/>
  <rect x="60" y="180" width="100" height="12" rx="6" fill="rgba(255,255,255,0.2)"/>
</svg>`
}

// 文件类型图标配置
const fileTypeIcons = [
  { ext: 'pdf', label: 'P', color: '#d93025' },
  { ext: 'doc', label: 'W', color: '#2b579a' },
  { ext: 'docx', label: 'W', color: '#2b579a' },
  { ext: 'xls', label: 'X', color: '#217346' },
  { ext: 'xlsx', label: 'X', color: '#217346' },
  { ext: 'ppt', label: 'P', color: '#d24726' },
  { ext: 'pptx', label: 'P', color: '#d24726' },
  { ext: 'ofd', label: 'O', color: '#0078d4' },
  { ext: 'dwg', label: 'C', color: '#e62328' },
  { ext: 'dxf', label: 'C', color: '#e62328' },
  { ext: 'dwf', label: 'C', color: '#e62328' },
  { ext: 'zip', label: 'Z', color: '#f2a900' },
  { ext: 'rar', label: 'R', color: '#8b4513' },
  { ext: '7z', label: '7', color: '#bc2f2d' },
  { ext: 'eml', label: 'E', color: '#0078d4' },
  { ext: 'msg', label: 'E', color: '#0078d4' },
  { ext: 'epub', label: 'B', color: '#6a5acd' },
  { ext: 'mobi', label: 'B', color: '#6a5acd' },
  { ext: 'csv', label: 'C', color: '#217346' },
  { ext: 'json', label: 'J', color: '#f7df1e' },
  { ext: 'xml', label: 'X', color: '#8b4513' },
  { ext: 'txt', label: 'T', color: '#666666' },
  { ext: 'md', label: 'M', color: '#083fa1' },
  { ext: 'rtf', label: 'R', color: '#8b4513' },
  { ext: 'odt', label: 'O', color: '#2b579a' },
  { ext: 'ods', label: 'O', color: '#217346' },
  { ext: 'odp', label: 'O', color: '#d24726' },
  { ext: 'stl', label: '3', color: '#6a5acd' },
  { ext: 'obj', label: '3', color: '#6a5acd' },
  { ext: 'gltf', label: '3', color: '#6a5acd' },
  { ext: 'glb', label: '3', color: '#6a5acd' },
  { ext: 'mp3', label: 'A', color: '#1db954' },
  { ext: 'wav', label: 'A', color: '#1db954' },
  { ext: 'flac', label: 'A', color: '#1db954' },
  { ext: 'mp4', label: 'V', color: '#ff0000' },
  { ext: 'webm', label: 'V', color: '#ff0000' },
  { ext: 'mkv', label: 'V', color: '#ff0000' },
  { ext: 'png', label: 'I', color: '#ff6b6b' },
  { ext: 'jpg', label: 'I', color: '#ff6b6b' },
  { ext: 'jpeg', label: 'I', color: '#ff6b6b' },
  { ext: 'gif', label: 'I', color: '#ff6b6b' },
  { ext: 'svg', label: 'I', color: '#ff6b6b' },
  { ext: 'webp', label: 'I', color: '#ff6b6b' },
  { ext: 'bmp', label: 'I', color: '#ff6b6b' },
  { ext: 'tiff', label: 'I', color: '#ff6b6b' },
  { ext: 'ico', label: 'I', color: '#ff6b6b' }
]

function main() {
  log('Generating icons...')
  ensureDir(BUILD_DIR)
  ensureDir(ICONS_DIR)

  // 检查是否有 convert (ImageMagick)
  let hasImageMagick = false
  try {
    execSync('which convert', { stdio: 'ignore' })
    hasImageMagick = true
    log('ImageMagick found, will generate ICO files')
  } catch (e) {
    log('ImageMagick not found, generating SVG placeholders only')
  }

  // 生成主应用图标
  const mainIconSvg = generateIconSvg('#ffffff', 'FV', '#1f966e')
  const mainIconPath = path.join(BUILD_DIR, 'icon.svg')
  fs.writeFileSync(mainIconPath, mainIconSvg)
  log(`Generated main icon: ${mainIconPath}`)

  if (hasImageMagick) {
    // 转换为 ICO
    try {
      const pngPath = path.join(BUILD_DIR, 'icon.png')
      const icoPath = path.join(BUILD_DIR, 'icon.ico')
      execSync(`convert -background none -resize 256x256 "${mainIconPath}" "${pngPath}"`)
      execSync(`convert "${pngPath}" -define icon:auto-resize=256,128,64,48,32,16 "${icoPath}"`)
      log(`Generated main ICO: ${icoPath}`)
    } catch (e) {
      log('Warning: Failed to generate main ICO')
    }
  }

  // 生成文件类型图标
  for (const icon of fileTypeIcons) {
    const svg = generateIconSvg('#ffffff', icon.label, icon.color)
    const svgPath = path.join(ICONS_DIR, `${icon.ext}.svg`)
    fs.writeFileSync(svgPath, svg)

    if (hasImageMagick) {
      try {
        const pngPath = path.join(ICONS_DIR, `${icon.ext}.png`)
        const icoPath = path.join(ICONS_DIR, `${icon.ext}.ico`)
        execSync(`convert -background none -resize 256x256 "${svgPath}" "${pngPath}"`)
        execSync(`convert "${pngPath}" -define icon:auto-resize=256,128,64,48,32,16 "${icoPath}"`)
      } catch (e) {
        // 静默失败
      }
    }
  }

  log(`Generated ${fileTypeIcons.length} file type icons in ${ICONS_DIR}`)
  log('Icon generation complete!')
}

main()
