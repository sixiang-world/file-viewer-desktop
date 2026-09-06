# File Viewer Desktop

基于 [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) 的离线文件查看器，支持 Windows 桌面应用和纯网页两种形态。

## 特性

- **完全离线**：所有 WASM、Worker、字体资源均本地打包，无需服务器端转换，适用于私密和内部网络环境
- **全格式支持**：Office 文档（Word/Excel/PPT）、PDF/OFD、CAD（DWG/DXF/DWF）、压缩包、电子邮件、电子书、图片、音频、视频、3D 模型、数据文件等
- **双形态交付**：
  - **网页版**：纯静态 HTML，双击即可在浏览器打开，可部署到任意静态服务器或内网
  - **桌面版（EXE）**：Windows 原生应用，支持文件关联、拖拽打开、双击启动

## 支持的文件格式

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
| 数据 | JSON, XML, YAML |

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- （可选）ImageMagick（用于生成应用图标）

### 1. 克隆项目

```bash
git clone https://github.com/flyfish-dev/file-viewer.git
git clone <your-repo>/file-viewer-desktop.git
```

目录结构：
```
workspace/
├── file-viewer/          # 上游 monorepo
└── file-viewer-desktop/  # 本项目
```

### 2. 构建网页版

```bash
cd file-viewer-desktop
node scripts/build-web.js
```

构建产物在 `web/` 目录，直接双击 `web/index.html` 即可在浏览器中打开使用。

### 3. 运行桌面版（开发模式）

```bash
npm install
npm start
```

### 4. 打包 Windows EXE

```bash
# 生成图标（可选）
node scripts/generate-icons.js

# 构建网页 + 打包 EXE
npm run build:all

# 或仅打包（假设已构建网页）
npm run build:win
```

打包产物在 `release/` 目录：
- `File Viewer-1.0.0-x64.exe` - NSIS 安装包
- `File Viewer-1.0.0-portable.exe` - 便携版（免安装）

## 使用方式

### 网页版

1. **直接打开**：双击 `web/index.html` 在浏览器中打开
2. **拖拽文件**：将文件拖放到页面中查看
3. **点击上传**：点击页面上的"打开文件"按钮选择文件
4. **URL 参数**：`index.html?url=https://example.com/file.pdf` 加载远程文件

### 桌面版（EXE）

支持三种打开方式：

1. **双击 EXE 启动**：打开应用主界面，可拖拽或点击选择文件
2. **文件关联打开**：右键文件 → "打开方式" → 选择 File Viewer，或安装后直接双击关联的文件类型
3. **拖拽到 EXE**：将文件拖放到 `File Viewer.exe` 图标上即可打开

## 项目结构

```
file-viewer-desktop/
├── electron/
│   ├── main.js          # Electron 主进程（窗口管理、文件关联、IPC）
│   └── preload.js       # 预加载脚本（暴露安全 API 给渲染进程）
├── web/                 # 网页构建产物（由 build-web.js 生成）
├── build/               # 构建资源（图标等）
├── scripts/
│   ├── build-web.js     # 构建网页版脚本
│   └── generate-icons.js # 生成应用图标脚本
├── package.json
└── README.md
```

## 技术架构

### 离线原理

file-viewer 采用浏览器原生技术栈：
- **WebAssembly (WASM)**：PDF、CAD、压缩包等格式的解析引擎
- **Web Workers**：后台线程处理大文件，避免 UI 阻塞
- **本地字体**：CJK 字体、PDF 标准字体等均打包在本地
- **相对路径**：所有资源使用相对路径引用，支持 `file://` 协议直接打开

### Electron 集成

- **单实例锁**：确保只有一个应用实例运行，第二次打开文件时激活已有窗口
- **自定义协议**：`file-viewer://` 协议安全访问本地文件
- **IPC 通信**：主进程读取文件内容，通过安全的 IPC 通道发送给渲染进程
- **文件关联**：通过 electron-builder 配置 Windows 文件关联和图标

## 隐私与安全

- **零服务器依赖**：所有文件解析在本地浏览器/应用中完成，文件不会上传到任何服务器
- **内网部署友好**：可部署到企业内网，无需外网访问
- **Context Isolation**：Electron 启用上下文隔离，渲染进程无法直接访问 Node.js API
- **安全文件访问**：通过自定义协议和 IPC 受控地访问本地文件

## 常见问题

### Q: 网页版直接双击打开，某些格式无法预览？

A: 部分浏览器（如 Chrome）对 `file://` 协议下的 Worker 和 WASM 加载有限制。建议：
- 使用 Firefox 或 Edge 浏览器
- 或用本地静态服务器打开：`npx serve web/`
- 或使用桌面版 EXE

### Q: EXE 体积太大？

A: Electron 应用基础体积约 80-100MB。如需更小体积，可考虑使用 Tauri 重构（需要 Rust 工具链）。

### Q: 如何添加更多文件格式关联？

A: 编辑 `package.json` 中的 `build.fileAssociations` 数组，添加新的扩展名和图标。

## 许可证

本项目基于 Apache-2.0 许可证，与上游 file-viewer 保持一致。

## 致谢

- [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) - 浏览器原生文件预览引擎
