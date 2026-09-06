const { app, BrowserWindow, ipcMain, protocol, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const url = require('url')

// ── 单实例锁：确保只有一个应用实例运行 ──
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // 第二实例启动时，将文件路径传给第一实例
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    const filePaths = extractFilePaths(commandLine)
    if (filePaths.length > 0) {
      openFilesInExistingWindow(filePaths)
    } else {
      // 没有文件参数，只是激活窗口
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }
    }
  })

  let mainWindow = null
  let pendingFiles = []

  // ── 从命令行参数中提取文件路径 ──
  function extractFilePaths(argv) {
    const files = []
    // 跳过第一个参数（electron 可执行文件路径）和第二个参数（app 路径）
    for (let i = 1; i < argv.length; i++) {
      const arg = argv[i]
      // 排除以 -- 开头的开关参数
      if (!arg.startsWith('--') && !arg.startsWith('-')) {
        const resolvedPath = path.resolve(arg)
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
          files.push(resolvedPath)
        }
      }
    }
    return files
  }

  // ── 创建主窗口 ──
  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      show: false,
      backgroundColor: '#f6f8f7',
      title: 'File Viewer',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    })

    // 加载离线网页
    const indexPath = path.join(__dirname, '..', 'web', 'index.html')
    mainWindow.loadFile(indexPath)

    // 页面加载完成后显示窗口
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.show()
      // 如果有待打开的文件，现在打开
      if (pendingFiles.length > 0) {
        sendFilesToRenderer(pendingFiles)
        pendingFiles = []
      }
    })

    // 窗口关闭时清理
    mainWindow.on('closed', () => {
      mainWindow = null
    })

    // 外部链接在默认浏览器中打开
    mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      shell.openExternal(targetUrl)
      return { action: 'deny' }
    })
  }

  // ── 将文件发送给渲染进程 ──
  function sendFilesToRenderer(filePaths) {
    if (!mainWindow || mainWindow.isDestroyed()) {
      pendingFiles = filePaths
      return
    }

    const files = filePaths.map(filePath => {
      try {
        const stats = fs.statSync(filePath)
        const fileName = path.basename(filePath)
        const ext = path.extname(filePath).toLowerCase().slice(1)
        return {
          path: filePath,
          name: fileName,
          extension: ext,
          size: stats.size,
          lastModified: stats.mtimeMs
        }
      } catch (err) {
        console.error('Error reading file:', filePath, err)
        return null
      }
    }).filter(Boolean)

    if (files.length > 0) {
      mainWindow.webContents.send('file:open', files)
    }
  }

  // ── 在已有窗口中打开文件 ──
  function openFilesInExistingWindow(filePaths) {
    if (!mainWindow || mainWindow.isDestroyed()) {
      pendingFiles = filePaths
      createWindow()
      return
    }

    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    sendFilesToRenderer(filePaths)
  }

  // ── 注册自定义协议：file-viewer:// 用于安全地访问本地文件 ──
  function registerCustomProtocol() {
    protocol.registerFileProtocol('file-viewer', (request, callback) => {
      try {
        const parsedUrl = new URL(request.url)
        // 解码路径，处理中文和特殊字符
        const filePath = decodeURIComponent(parsedUrl.pathname)
        // 安全检查：防止路径遍历
        const resolvedPath = path.resolve(filePath)
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
          callback({ path: resolvedPath })
        } else {
          callback({ error: -6 }) // FILE_NOT_FOUND
        }
      } catch (err) {
        console.error('Protocol error:', err)
        callback({ error: -2 }) // FAILED
      }
    })
  }

  // ── IPC 处理：读取文件内容 ──
  ipcMain.handle('file:read', async (event, filePath) => {
    try {
      const resolvedPath = path.resolve(filePath)
      if (!fs.existsSync(resolvedPath)) {
        throw new Error('File not found: ' + filePath)
      }
      const buffer = fs.readFileSync(resolvedPath)
      // 将 Buffer 转为 Uint8Array 以便在渲染进程中使用
      return {
        success: true,
        data: new Uint8Array(buffer),
        name: path.basename(resolvedPath),
        size: buffer.length
      }
    } catch (err) {
      console.error('Error reading file:', err)
      return {
        success: false,
        error: err.message
      }
    }
  })

  // ── IPC 处理：获取文件信息 ──
  ipcMain.handle('file:info', async (event, filePath) => {
    try {
      const resolvedPath = path.resolve(filePath)
      const stats = fs.statSync(resolvedPath)
      return {
        success: true,
        path: resolvedPath,
        name: path.basename(resolvedPath),
        extension: path.extname(resolvedPath).slice(1),
        size: stats.size,
        lastModified: stats.mtimeMs,
        created: stats.birthtimeMs
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // ── IPC 处理：打开文件选择对话框 ──
  ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow) return { canceled: true, filePaths: [] }
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择要预览的文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '所有支持的文件', extensions: ['*'] },
        { name: '文档', extensions: ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'md', 'ofd'] },
        { name: '表格', extensions: ['xls', 'xlsx', 'csv', 'ods'] },
        { name: '演示', extensions: ['ppt', 'pptx', 'odp'] },
        { name: 'CAD', extensions: ['dwg', 'dxf', 'dwf'] },
        { name: '压缩包', extensions: ['zip', 'rar', '7z', 'tar', 'gz'] },
        { name: '邮件', extensions: ['eml', 'msg'] },
        { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff'] },
        { name: '视频', extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov'] },
        { name: '音频', extensions: ['mp3', 'wav', 'flac', 'ogg', 'aac'] },
        { name: '3D模型', extensions: ['stl', 'obj', 'gltf', 'glb', 'fbx'] },
        { name: '数据', extensions: ['json', 'xml', 'yaml', 'yml'] }
      ]
    })
    return result
  })

  // ── IPC 处理：在资源管理器中显示文件 ──
  ipcMain.handle('shell:showInFolder', (event, filePath) => {
    shell.showItemInFolder(filePath)
  })

  // ── App 事件 ──

  // 当 Electron 完成初始化并准备创建浏览器窗口时调用
  app.whenReady().then(() => {
    registerCustomProtocol()
    createWindow()

    // 处理启动时的文件参数（Windows 文件关联 / 拖放到 exe）
    const startupFiles = extractFilePaths(process.argv)
    if (startupFiles.length > 0) {
      // 等待页面加载完成后再发送
      pendingFiles = startupFiles
    }

    app.on('activate', () => {
      // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
      // 通常在应用程序中重新创建一个窗口
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  // 当所有窗口关闭时退出应用
  app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // 处理 Windows 上的文件关联（当应用已经在运行时）
  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    openFilesInExistingWindow([filePath])
  })
}
