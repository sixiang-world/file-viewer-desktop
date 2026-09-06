const { contextBridge, ipcRenderer } = require('electron')

// ── 暴露给渲染进程的安全 API ──
contextBridge.exposeInMainWorld('fileViewerDesktop', {
  // 平台信息
  platform: process.platform,
  isElectron: true,

  // ── 文件操作 ──

  /**
   * 读取文件内容，返回 Uint8Array
   * @param {string} filePath - 文件绝对路径
   * @returns {Promise<{success: boolean, data?: Uint8Array, name?: string, size?: number, error?: string}>}
   */
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

  /**
   * 获取文件信息
   * @param {string} filePath - 文件绝对路径
   */
  getFileInfo: (filePath) => ipcRenderer.invoke('file:info', filePath),

  /**
   * 打开文件选择对话框
   */
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  /**
   * 在资源管理器中显示文件
   */
  showInFolder: (filePath) => ipcRenderer.invoke('shell:showInFolder', filePath),

  // ── 事件监听 ──

  /**
   * 监听文件打开事件（从命令行参数、文件关联、拖拽等触发）
   * @param {function} callback - 回调函数，接收文件数组
   * @returns {function} 取消监听的函数
   */
  onFileOpen: (callback) => {
    const listener = (event, files) => callback(files)
    ipcRenderer.on('file:open', listener)
    return () => ipcRenderer.removeListener('file:open', listener)
  },

  /**
   * 一次性监听文件打开事件
   */
  onceFileOpen: (callback) => {
    const listener = (event, files) => callback(files)
    ipcRenderer.once('file:open', listener)
  },

  // ── 工具函数 ──

  /**
   * 将文件路径转换为可在网页中使用的自定义协议 URL
   * @param {string} filePath - 文件绝对路径
   * @returns {string} file-viewer:// 协议 URL
   */
  pathToUrl: (filePath) => {
    // 使用自定义协议，确保安全访问本地文件
    const encodedPath = encodeURI(filePath.replace(/\\/g, '/'))
    return `file-viewer:///${encodedPath}`
  },

  /**
   * 读取文件并转换为浏览器 File 对象
   * @param {string} filePath - 文件绝对路径
   * @returns {Promise<File|null>}
   */
  readFileAsFile: async (filePath) => {
    const result = await ipcRenderer.invoke('file:read', filePath)
    if (result.success && result.data) {
      return new File([result.data], result.name, {
        type: getMimeType(result.name)
      })
    }
    return null
  }
})

// ── 简单的 MIME 类型推断 ──
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const mimeMap = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    htm: 'text/html',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    bmp: 'image/bmp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    eml: 'message/rfc822',
    ofd: 'application/ofd',
    dwg: 'application/acad',
    dxf: 'application/dxf',
    stl: 'model/stl',
    obj: 'model/obj',
    gltf: 'model/gltf+json',
    glb: 'model/gltf-binary',
    epub: 'application/epub+zip'
  }
  return mimeMap[ext] || 'application/octet-stream'
}
