# File Viewer Desktop（Windows 桌面版）

> 基于 [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) 的 Windows 离线文件查看器，支持 50+ 种格式，无需服务器端转换，支持文件关联和拖拽打开。

[![Build Desktop App](https://github.com/sixiang-world/file-viewer-desktop/actions/workflows/build.yml/badge.svg)](https://github.com/sixiang-world/file-viewer-desktop/actions/workflows/build.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 🔗 仓库关系说明

**本仓库不能独立运行**，它依赖姊妹仓库 [file-viewer-standalone](https://github.com/sixiang-world/file-viewer-standalone) 的构建产物作为 Electron 的渲染内容。

```
┌─────────────────────────────────────────┐
│  file-viewer-standalone                  │
│  https://github.com/sixiang-world/       │
│         file-viewer-standalone            │
│                                          │
│  Vue 3 + Vite + @file-viewer/vue3-full  │
│  构建产物: dist/ (静态网页)               │
└──────────────────┬──────────────────────┘
                   │
                   │  1. GitHub Actions 自动拉取
                   │  2. 构建 standalone
                   │  3. 复制到 web/ 目录
                   ▼
┌─────────────────────────────────────────┐
│  file-viewer-desktop (本仓库)             │
│                                          │
│  Electron 主进程 + 文件关联 + IPC         │
│  构建产物:                                │
│    - File Viewer-*-x64.exe (安装包)      │
│    - File Viewer-*-portable.exe (便携版)  │
└─────────────────────────────────────────┘
```

### 为什么分成两个仓库？

1. **职责分离**：standalone 专注网页端功能开发，desktop 专注桌面端集成（文件关联、系统集成等）
2. **独立版本**：网页版可以独立发布和部署，桌面版可以独立迭代桌面端功能
3. **复用性**：网页版构建产物可被多种桌面框架（Electron、Tauri、NW.js）复用
4. **构建优化**：网页端构建耗时较长，分离后桌面端构建只需关注打包逻辑

---

## ✨ 特性

- **完全离线**：所有 WASM、Worker、字体资源均本地打包，无需服务器端转换
- **三种打开方式**：
  - ✅ 双击 EXE 启动，拖拽或点击选择文件
  - ✅ 右键文件 → "打开方式" → File Viewer（文件关联）
  - ✅ 将文件拖放到 EXE 图标上打开
- **全格式支持**：Office、PDF/OFD、CAD、压缩包、电子邮件、电子书、图片、音频、视频、3D 模型、数据文件等
- **单实例运行**：确保只有一个应用实例，第二次打开文件时激活已有窗口
- **安全隔离**：Context Isolation + 自定义协议，渲染进程无法直接访问 Node.js API
- **安装版 + 便携版**：提供 NSIS 安装包和免安装便携版

---

## 📋 支持的文件格式（50+ 种）

| 类别 | 格式 |
|------|------|
| 文档 | PDF, DOC, DOCX, ODT, RTF, TXT, MD, OFD, EPUB |
| 表格 | XLS, XLSX, CSV, ODS |
| 演示 | PPT, PPTX, ODP |
| CAD | DWG, DXF, DWF, DWFx |
| 压缩包 | ZIP, RAR, 7Z, TAR, GZ |
| 邮件 | EML, MSG |
| 图片 | PNG, JPG, GIF, SVG, WebP, BMP, TIFF, ICO |
| 视频 | MP4, WebM, MKV, AVI, MOV |
| 音频 | MP3, WAV, FLAC, OGG, AAC |
| 3D 模型 | STL, OBJ, glTF, GLB, FBX |
| 数据 | JSON, XML, YAML, CSV |

---

## 🚀 快速开始

### 方式一：下载预构建版本（推荐）

1. 前往 [Actions 页面](https://github.com/sixiang-world/file-viewer-desktop/actions/workflows/build.yml)
2. 选择最新的成功构建
3. 下载 `file-viewer-windows-installer` 产物
4. 运行安装包或便携版

或者，手动触发构建并创建 Release：
1. 点击 [Actions → Build Desktop App → Run workflow](https://github.com/sixiang-world/file-viewer-desktop/actions/workflows/build.yml)
2. 将 `Create GitHub Release` 设为 `true`
3. 构建完成后在 [Releases](https://github.com/sixiang-world/file-viewer-desktop/releases) 页面下载

### 方式二：本地构建

#### 前置要求

- Node.js >= 18
- Windows 系统（electron-builder 打包 Windows EXE 推荐在 Windows 环境）
- 建议 8GB+ 内存

#### 构建步骤

```bash
# 1. 克隆两个仓库（放在同一目录下）
git clone https://github.com/sixiang-world/file-viewer-standalone.git
git clone https://github.com/sixiang-world/file-viewer-desktop.git

# 2. 构建网页版
cd file-viewer-standalone
npm install
set NODE_OPTIONS=--max-old-space-size=8192
npm run build

# 3. 将构建产物复制到桌面项目的 web/ 目录
xcopy /E /I dist ..\file-viewer-desktop\web

# 4. 构建桌面版
cd ..\file-viewer-desktop
npm install

# 生成图标（可选，需要 ImageMagick）
node scripts/generate-icons.js

# 打包 Windows EXE（安装版 + 便携版）
npm run build:win
```

构建产物在 `release/` 目录：
- `File Viewer-1.0.0-x64.exe` - NSIS 安装包
- `File Viewer-1.0.0-portable.exe` - 免安装便携版

---

## 📖 使用方式

### 方式一：双击 EXE 启动
1. 双击 `File Viewer.exe` 打开应用
2. 将文件拖放到窗口中，或点击"选择文件"按钮
3. 文件将在应用内预览

### 方式二：文件关联打开（安装版）
1. 安装时会自动配置文件关联
2. 右键任意支持的文件 → "打开方式" → 选择 "File Viewer"
3. 或直接双击已关联的文件类型

### 方式三：拖拽到 EXE
1. 将文件拖放到 `File Viewer.exe` 图标上
2. 应用将自动启动并打开该文件

### 运行中拖拽
应用运行中，也可以直接将文件拖放到窗口内打开。

---

## 🔧 GitHub Actions 自动打包

本仓库配置了 GitHub Actions 自动打包工作流（`.github/workflows/build.yml`），**自动拉取 standalone 仓库并构建**。

### 触发条件
- **自动触发**：push 或 PR 到 `main` 分支时自动构建
- **手动触发**：Actions 页面点击 "Run workflow"，可指定 standalone 的分支/标签/commit

### 工作流步骤（Windows 环境）
1. Checkout desktop 仓库
2. Setup Node.js 20
3. **Checkout standalone 仓库**（自动拉取姊妹仓库）
4. 安装 standalone 依赖并构建（8GB 内存）
5. 将 standalone 构建产物复制到 `web/` 目录
6. 安装 desktop 依赖
7. `electron-builder` 打包 Windows EXE（NSIS + Portable）
8. 上传安装包 artifact
9. （可选）创建 GitHub Release

### 构建产物
- `file-viewer-windows-installer`：包含安装版和便携版 EXE（artifact，保留 30 天）
- **可选 Release**：手动触发时可选择创建 GitHub Release，包含安装包下载链接

### 手动触发参数
| 参数 | 说明 | 默认值 |
|------|------|--------|
| `standalone_ref` | standalone 仓库的分支/标签/commit | `main` |
| `create_release` | 是否创建 GitHub Release | `false` |

---

## 📁 项目结构

```
file-viewer-desktop/
├── .github/
│   └── workflows/
│       └── build.yml              # GitHub Actions 自动打包
├── electron/
│   ├── main.js                    # Electron 主进程
│   │                              #  - 窗口管理
│   │                              #  - 单实例锁
│   │                              #  - 命令行参数解析（文件关联/拖拽）
│   │                              #  - IPC 通信（文件读取）
│   │                              #  - 自定义协议 file-viewer://
│   └── preload.js                 # 预加载脚本
│                                  #  - 安全 API 暴露
│                                  #  - 文件读取/信息获取
│                                  #  - 文件打开事件监听
├── web/                           # 网页构建产物（从 standalone 复制，git 忽略）
├── build/                         # 构建资源（图标等）
├── scripts/
│   ├── build-web.js               # 网页版构建脚本（从上游 monorepo）
│   └── generate-icons.js          # 应用图标和文件类型图标生成
├── package.json                   # electron-builder 配置 + 50+ 格式文件关联
└── README.md                      # 本文件
```

---

## 🏗️ 技术架构

### Electron 主进程（`electron/main.js`）

#### 1. 单实例锁
```javascript
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) app.quit()
```
- 确保只有一个应用实例运行
- 第二次打开文件时，通过 `second-instance` 事件将文件路径传给第一实例
- 激活已有窗口并打开新文件

#### 2. 命令行参数解析
```javascript
function extractFilePaths(argv) {
  // 解析 process.argv，提取文件路径
  // 支持：文件关联打开、拖拽到 EXE、命令行参数
}
```
- Windows 文件关联：系统将文件路径作为命令行参数传入
- 拖拽到 EXE：Windows 同样将文件路径作为命令行参数
- 启动时解析参数，页面加载完成后发送给渲染进程

#### 3. IPC 通信
- `file:read`：读取文件内容，返回 Uint8Array
- `file:info`：获取文件信息（大小、修改时间等）
- `dialog:openFile`：打开文件选择对话框
- `shell:showInFolder`：在资源管理器中显示文件

#### 4. 自定义协议 `file-viewer://`
- 安全地访问本地文件
- 防止路径遍历攻击
- 支持中文和特殊字符路径

### 预加载脚本（`electron/preload.js`）

通过 `contextBridge` 暴露安全 API：
```javascript
window.fileViewerDesktop = {
  isElectron: true,
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke('file:info', filePath),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  onFileOpen: (callback) => { /* 监听文件打开事件 */ },
  readFileAsFile: async (filePath) => { /* 读取为浏览器 File 对象 */ }
}
```

### electron-builder 配置（`package.json`）

- **文件关联**：配置 50+ 种格式的文件关联和图标
- **NSIS 安装包**：支持自定义安装目录、桌面快捷方式、开始菜单
- **便携版**：免安装，直接运行
- **应用图标**：`build/icon.ico`
- **文件类型图标**：`build/icons/*.ico`

---

## 🔒 隐私与安全

- **零服务器依赖**：所有文件解析在本地应用中完成，文件不会上传到任何服务器
- **Context Isolation**：Electron 启用上下文隔离，渲染进程无法直接访问 Node.js API
- **Node Integration 关闭**：渲染进程运行在纯浏览器环境，无法执行系统命令
- **安全文件访问**：通过自定义协议和 IPC 受控地访问本地文件，防止路径遍历
- **内网友好**：可完全离线使用，无需网络连接
- **无遥测**：不收集任何使用数据或用户信息

---

## ❓ 常见问题

### Q: 安装后双击文件没有用 File Viewer 打开？

A: 请检查：
1. 右键文件 → "打开方式" → "选择其他应用" → 找到 File Viewer → 勾选"始终使用此应用打开"
2. 或在设置 → 应用 → 默认应用中配置文件关联
3. 重新运行安装程序，确保安装过程中没有被安全软件拦截

### Q: 便携版如何设置文件关联？

A: 便携版不自动配置文件关联。如需关联：
1. 右键文件 → "打开方式" → "选择其他应用"
2. 浏览到便携版 EXE 位置并选择
3. 勾选"始终使用此应用打开"

### Q: EXE 体积太大？

A: Electron 应用基础体积约 80-100MB（包含 Chromium 运行时）。如需更小体积：
- 考虑使用 [Tauri](https://tauri.app/) 重构（需要 Rust 工具链，体积可减小到 10-20MB）
- 或使用网页版（仅几 MB，但需要浏览器）

### Q: 如何添加更多文件格式关联？

A: 编辑 `package.json` 中的 `build.fileAssociations` 数组，添加新的扩展名和图标。然后重新打包。

### Q: 构建失败怎么办？

A: 
1. 检查是否有 8GB+ 可用内存
2. 检查网络连接（需要下载 Electron 和 standalone 仓库）
3. 查看 Actions 构建日志获取详细错误信息
4. 或在本地环境构建（推荐 Windows 环境）

### Q: 可以在 macOS 或 Linux 上运行吗？

A: 当前只配置了 Windows 打包。如需 macOS/Linux 版本：
1. 修改 `package.json` 中的 `build` 配置，添加 mac/linux 目标
2. 在对应系统上运行 `electron-builder`
3. 代码本身是跨平台的，主进程逻辑兼容 macOS/Linux

---

## 📄 许可证

本项目基于 [Apache-2.0](LICENSE) 许可证，与上游 file-viewer 保持一致。

---

## 🙏 致谢

- [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) - 浏览器原生文件预览引擎
- [file-viewer-standalone](https://github.com/sixiang-world/file-viewer-standalone) - 姊妹仓库，网页版构建
- [Electron](https://www.electronjs.org/) - 桌面应用框架
- [electron-builder](https://www.electron.build/) - 安装包打包工具
