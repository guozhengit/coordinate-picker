// PDF.js类型声明
interface PDFLib {
  getDocument: any;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

interface Window {
  pdfjsLib: PDFLib;
}

// 类型定义
interface Coordinates {
  x: number;
  y: number;
  canvasX?: number;
  canvasY?: number;
}

interface RelativeCoordinates {
  x: number;
  y: number;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageData {
  imageData: ImageData;
  width: number;
  height: number;
  pageNum: number;
}

interface ConvertedDocument {
  type: 'pdf' | 'image';
  pages: PageData[];
  totalPages: number;
}

interface ImageRendererOptions {
  scale?: number;
  onRender?: () => void;
  onError?: (error: Error) => void;
}

interface ComponentStyle {
  font?: number;
  fontColor?: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

interface ComponentPosition {
  x: number;
  y: number;
  page?: number;
}

interface ComponentContext {
  style?: ComponentStyle;
  componentName?: string;
  position: ComponentPosition;
}

type ContextPayload = { context: ComponentContext } | ComponentContext | ComponentContext[];

interface ResizeHandle {
  x: number;
  y: number;
  direction?: string;
  cursor?: string;
}

// 设置PDF.js worker
if (typeof window !== 'undefined' && window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// 图片渲染器类 - 通用的图片到Canvas渲染模块
class ImageRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number;
  private imageData: ImageData | null = null;
  private onRender: () => void;
  private onError: (error: Error) => void;

  constructor(canvas: HTMLCanvasElement, options: ImageRendererOptions = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取canvas 2d上下文');
    }
    this.ctx = context;
    this.scale = options.scale || 1.5;

    // 回调函数
    this.onRender = options.onRender || (() => {});
    this.onError =
      options.onError || ((error: Error) => console.error('渲染错误:', error));
  }

  // 从图片数据渲染到Canvas
  async renderFromImageData(
    imageData: ImageData,
    width: number,
    height: number
  ): Promise<void> {
    try {
      this.canvas.width = width;
      this.canvas.height = height;

      this.ctx.putImageData(imageData, 0, 0);
      this.imageData = imageData;

      this.onRender();
    } catch (error) {
      this.onError(error as Error);
    }
  }

  // 从图片元素渲染到Canvas
  async renderFromImage(img: HTMLImageElement): Promise<void> {
    try {
      const width = img.width * this.scale;
      const height = img.height * this.scale;

      this.canvas.width = width;
      this.canvas.height = height;

      this.ctx.drawImage(img, 0, 0, width, height);
      this.imageData = this.ctx.getImageData(0, 0, width, height);

      this.onRender();
    } catch (error) {
      this.onError(error as Error);
    }
  }

  // 从URL渲染图片
  async renderFromUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          await this.renderFromImage(img);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = url;
    });
  }

  // 从File对象渲染图片
  async renderFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (e.target?.result) {
            await this.renderFromUrl(e.target.result as string);
            resolve();
          } else {
            reject(new Error('文件读取结果为空'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  // 获取当前渲染的图片数据
  getImageData(): ImageData | null {
    return this.imageData;
  }

  // 清除Canvas
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.imageData = null;
  }

  // 重新绘制（用于选区操作后恢复原图）
  redraw(): void {
    if (this.imageData) {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
  }
}

// 文件转换器类 - 将不同格式文件转换为图片数据
class FileConverter {
  private supportedTypes: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/jpg': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'image/svg+xml': 'image',
  };

  // 检查文件类型是否支持
  isSupported(file: File): boolean {
    return this.supportedTypes.hasOwnProperty(file.type);
  }

  // 获取文件类型
  getFileType(file: File): string {
    return this.supportedTypes[file.type] || 'unknown';
  }

  // 转换PDF为图片数据数组
  async convertPDF(file: File): Promise<ConvertedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);
    const pdfDoc = await window.pdfjsLib.getDocument(pdfData).promise;

    const pages: PageData[] = [];
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建canvas上下文');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      pages.push({
        imageData: imageData,
        width: canvas.width,
        height: canvas.height,
        pageNum: pageNum,
      });
    }

    return {
      type: 'pdf',
      pages: pages,
      totalPages: pdfDoc.numPages,
    };
  }

  // 转换图片文件
  async convertImage(file: File): Promise<ConvertedDocument> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        resolve({
          type: 'image',
          pages: [
            {
              imageData: imageData,
              width: canvas.width,
              height: canvas.height,
              pageNum: 1,
            },
          ],
          totalPages: 1,
        });
      };
      img.onerror = () => reject(new Error('图片加载失败'));

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('文件读取结果为空'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  // 主转换方法
  async convert(file: File): Promise<ConvertedDocument> {
    const fileType = this.getFileType(file);

    switch (fileType) {
      case 'pdf':
        return await this.convertPDF(file);
      case 'image':
        return await this.convertImage(file);
      default:
        throw new Error(`不支持的文件类型: ${file.type}`);
    }
  }
}

// 全局变量类型定义
let documentInstance: any = null;
let currentPageNumber: number = 1;
let renderScale: number = 1.5;
let zoomLevel: number = 1.0; // 缩放级别
let loadedDocument: ConvertedDocument | null = null; // 当前文档数据
let imageRenderer: ImageRenderer | null = null; // 图片渲染器
let fileConverter: FileConverter | null = null; // 文件转换器
let previewContexts: ComponentContext[] = []; // 需要回显的控件上下文

// DOM元素获取
const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const fileSelector = document.getElementById('fileSelector') as HTMLElement;
const currentPageDisplay = document.getElementById(
  'currentPage'
) as HTMLElement;
const totalPagesSpan = document.getElementById('totalPages') as HTMLElement;
const prevButton = document.getElementById('prevPage') as HTMLButtonElement;
const nextButton = document.getElementById('nextPage') as HTMLButtonElement;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const fileSelectorButton = document.getElementById(
  'fileSelector'
) as HTMLElement;
const coordinateOutput = document.getElementById(
  'coordinateOutput'
) as HTMLElement;
const selectionOutput = document.getElementById(
  'selectionOutput'
) as HTMLElement;
const selectionOverlay = document.getElementById(
  'selectionOverlay'
) as HTMLElement;
const canvasContainer = document.getElementById(
  'canvasContainer'
) as HTMLElement;
const componentOverlay = document.getElementById(
  'componentOverlay'
) as HTMLElement;
const contextHint = document.getElementById('contextHint') as HTMLElement | null;
const contextInput = document.getElementById('contextInput') as HTMLTextAreaElement | null;
const applyContextButton = document.getElementById('applyContext') as HTMLButtonElement | null;
const copyContextButton = document.getElementById('copyContext') as HTMLButtonElement | null;
const clearContextButton = document.getElementById('clearContext') as HTMLButtonElement | null;
const originSelect = document.getElementById(
  'originSelect'
) as HTMLSelectElement;
const zoomInButton = document.getElementById('zoomIn') as HTMLButtonElement;
const zoomOutButton = document.getElementById('zoomOut') as HTMLButtonElement;
const zoomResetButton = document.getElementById('zoomReset') as HTMLButtonElement;
const zoomLevelDisplay = document.getElementById('zoomLevel') as HTMLElement;

// 框选相关变量
let isSelecting: boolean = false;
let startX: number = 0;
let startY: number = 0;
let currentSelection: SelectionRect | null = null;
let selectionRect: SelectionRect | null = null; // 选区矩形

// 拖动选区相关变量
let isDraggingSelection: boolean = false;
let dragStartX: number = 0;
let dragStartY: number = 0;
let selectionStartX: number = 0;
let selectionStartY: number = 0;

// 调整选区大小相关变量
let isResizingSelection: boolean = false;
let resizeDirection: string = '';
let originalSelectionRect: SelectionRect | null = null;

// 初始化模块
function initializeModules(): void {
  imageRenderer = new ImageRenderer(canvas, {
    scale: renderScale,
    onRender: () => {
      // 渲染完成回调
      console.log('页面渲染完成');
    },
    onError: (error: Error) => {
      console.error('渲染错误:', error);
      fileSelector.textContent = '渲染失败: ' + error.message;
      fileSelector.style.display = 'block';
      canvas.style.display = 'none';
    },
  });

  fileConverter = new FileConverter();
}

function safeJsonParse(input: string): any | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function normalizeContexts(payload: ContextPayload): ComponentContext[] {
  const maybeAny = payload as any;

  // 1) 直接传 contexts 数组：[{...},{...}]
  if (Array.isArray(maybeAny)) {
    // 允许数组里既是 context 也可能是 {context: {...}} 或 { ..., context: {...} }
    return maybeAny
      .map((item: any) => {
        if (!item) return null;
        if (item.position) return item as ComponentContext;
        if (item.context && item.context.position) return item.context as ComponentContext;
        return null;
      })
      .filter(Boolean) as ComponentContext[];
  }

  // 2) 你提供的完整入参：{ fileNo, userId, components: [{..., context: {...}}, ...] }
  if (maybeAny && typeof maybeAny === 'object' && Array.isArray(maybeAny.components)) {
    return maybeAny.components
      .map((c: any) => (c && c.context && c.context.position ? (c.context as ComponentContext) : null))
      .filter(Boolean) as ComponentContext[];
  }

  // 3) 包一层：{ context: {...} }
  if (maybeAny && typeof maybeAny === 'object' && maybeAny.context && maybeAny.context.position) {
    return [maybeAny.context as ComponentContext];
  }

  // 4) 直接传单个 context：{ style, componentName, position }
  if (maybeAny && typeof maybeAny === 'object' && maybeAny.position) {
    return [maybeAny as ComponentContext];
  }

  return [];
}

function loadContextsFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('contexts') || params.get('context');
  if (!raw) return;

  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  const parsed = safeJsonParse(decoded);
  if (!parsed) {
    console.warn('无法解析回显参数 context/contexts');
    if (contextHint) {
      contextHint.textContent = '回显参数解析失败：请检查 URL 中的 JSON';
    }
    return;
  }

  previewContexts = normalizeContexts(parsed).filter((c) => !!c && !!c.position);
  if (contextHint) {
    contextHint.textContent = `已加载回显控件：${previewContexts.length} 个`;
  }
}

function setContextsFromText(rawText: string): boolean {
  const text = (rawText || '').trim();
  if (!text) {
    previewContexts = [];
    if (contextHint) contextHint.textContent = '未加载回显控件';
    renderComponentOverlays();
    return true;
  }

  // 允许用户直接粘贴 URL encode 过的 JSON
  const decoded = (() => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  })();

  const parsed = safeJsonParse(decoded);
  if (!parsed) {
    if (contextHint) contextHint.textContent = '参数解析失败：请粘贴合法 JSON';
    return false;
  }

  const contexts = normalizeContexts(parsed).filter((c) => !!c && !!c.position);
  if (!contexts.length) {
    if (contextHint) contextHint.textContent = '参数为空或缺少 position';
    previewContexts = [];
    renderComponentOverlays();
    return false;
  }

  previewContexts = contexts;
  if (contextHint) contextHint.textContent = `已加载回显控件：${previewContexts.length} 个`;
  renderComponentOverlays();
  return true;
}

function autosizeContextTextarea(): void {
  if (!contextInput) return;
  // 根据内容自适应高度，尽量让“单页参数”不出现滚动条
  contextInput.style.height = 'auto';
  const maxHeight = Math.round(window.innerHeight * 0.75);
  contextInput.style.height = `${Math.min(contextInput.scrollHeight, maxHeight)}px`;
}

function bindContextInputUi(): void {
  if (applyContextButton && contextInput) {
    applyContextButton.addEventListener('click', () => {
      setContextsFromText(contextInput.value);
      autosizeContextTextarea();
    });

    contextInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setContextsFromText(contextInput.value);
        autosizeContextTextarea();
      }
    });
  }

  if (copyContextButton && contextInput) {
    copyContextButton.addEventListener('click', async () => {
      const text = contextInput.value || '';
      const ok = await copyToClipboard(text);
      if (ok) {
        if (contextHint) contextHint.textContent = '已复制到剪贴板';
        const original = copyContextButton.textContent || '复制';
        copyContextButton.textContent = '已复制';
        setTimeout(() => {
          copyContextButton.textContent = original;
        }, 800);
      } else {
        if (contextHint) contextHint.textContent = '复制失败（可手动全选复制）';
      }
    });
  }

  if (clearContextButton && contextInput) {
    clearContextButton.addEventListener('click', () => {
      contextInput.value = '';
      setContextsFromText('');
      autosizeContextTextarea();
    });
  }
}

function clearComponentOverlays(): void {
  componentOverlay.innerHTML = '';
}

function renderComponentOverlays(): void {
  clearComponentOverlays();
  if (!previewContexts.length) return;

  // overlay 尺寸要跟随 canvas
  componentOverlay.style.width = `${canvas.width}px`;
  componentOverlay.style.height = `${canvas.height}px`;

  const factor = renderScale * zoomLevel;
  const origin = originSelect.value;

  const currentPageContexts = previewContexts.filter((c) => {
    const page = c.position?.page ?? 1;
    return page === currentPageNumber;
  });

  currentPageContexts.forEach((c) => {
    const w = Math.max(1, Math.round((c.style?.width ?? 1) * factor));
    const h = Math.max(1, Math.round((c.style?.height ?? 1) * factor));
    const px = (c.position?.x ?? 0) * factor;
    const py = (c.position?.y ?? 0) * factor;

    let left = 0;
    let top = 0;
    switch (origin) {
      case 'top-left':
        left = px;
        top = py;
        break;
      case 'bottom-left':
        left = px;
        top = canvas.height - py - h;
        break;
      case 'top-right':
        left = canvas.width - px - w;
        top = py;
        break;
      case 'bottom-right':
        left = canvas.width - px - w;
        top = canvas.height - py - h;
        break;
      default:
        left = px;
        top = py;
    }

    const marker = document.createElement('div');
    marker.className = 'component-marker';
    marker.style.left = `${Math.round(left)}px`;
    marker.style.top = `${Math.round(top)}px`;
    marker.style.width = `${w}px`;
    marker.style.height = `${h}px`;

    const label = document.createElement('div');
    label.className = 'component-label';
    label.textContent = c.componentName || '未命名控件';

    // 样式回显（字体/颜色/字号）
    if (c.style?.fontColor) {
      const fc = c.style.fontColor.replace('#', '');
      if (/^[0-9a-fA-F]{6}$/.test(fc)) {
        label.style.color = `#${fc}`;
      }
    }
    if (c.style?.fontSize) {
      label.style.fontSize = `${Math.max(10, Math.round(c.style.fontSize * zoomLevel))}px`;
    }

    marker.appendChild(label);
    componentOverlay.appendChild(marker);
  });
}

function updateContextInputFromSelection(): void {
  if (!contextInput) return;
  if (!currentSelection) return;

  const ctxObj: { context: ComponentContext } = {
    context: {
      componentName: '未命名控件',
      style: {
        width: currentSelection.width,
        height: currentSelection.height,
      },
      position: {
        x: currentSelection.x,
        y: currentSelection.y,
        page: currentPageNumber,
      },
    },
  };

  contextInput.value = JSON.stringify(ctxObj, null, 2);
  autosizeContextTextarea();

  // 同步刷新回显（让左侧生成的参数立刻可用于右侧回显）
  previewContexts = [ctxObj.context];
  if (contextHint) contextHint.textContent = `已加载回显控件：${previewContexts.length} 个`;
  renderComponentOverlays();
}

// 加载文件（支持多种格式）
async function loadFile(file: File): Promise<void> {
  try {
    // 检查文件类型
    if (!fileConverter?.isSupported(file)) {
      const supportedFormats = '.pdf, .png, .jpg, .jpeg, .gif, .webp, .svg';
      throw new Error(`不支持的文件类型: ${file.type}\n支持的格式: ${supportedFormats}`);
    }

    fileSelector.style.display = 'block';
    canvas.style.display = 'none';
    fileSelector.textContent = '正在加载...';

    // 转换文件为图片数据
    loadedDocument = await fileConverter.convert(file);

    totalPagesSpan.textContent = loadedDocument.totalPages.toString();
    currentPageNumber = 1;

    fileSelector.style.display = 'none';

    // 显示页面控制（如果有多页）
    if (loadedDocument.totalPages > 1) {
      prevButton.style.display = 'block';
      nextButton.style.display = 'block';
    } else {
      prevButton.style.display = 'none';
      nextButton.style.display = 'none';
    }

    canvas.style.display = 'block';

    await renderPage(currentPageNumber);
    updatePageControls();
  } catch (error) {
    console.error('加载失败:', error);
    const errorMessage = (error as Error).message;
    fileSelector.innerHTML = `<div style="color: #dc3545; font-weight: bold;">❌ 加载失败</div><div style="margin-top: 10px; font-size: 12px;">${errorMessage}</div><div style="margin-top: 10px; font-size: 12px; color: #666;">请点击重新选择文件</div>`;
    fileSelector.style.display = 'block';
    canvas.style.display = 'none';
  }
}

// 渲染页面（使用新的模块化架构）
async function renderPage(pageNum: number): Promise<void> {
  if (!loadedDocument || !loadedDocument.pages[pageNum - 1]) {
    throw new Error('页面数据不存在');
  }

  const pageData = loadedDocument.pages[pageNum - 1];

  // 使用ImageRenderer渲染（应用缩放）
  if (imageRenderer) {
    const scaledWidth = Math.round(pageData.width * zoomLevel);
    const scaledHeight = Math.round(pageData.height * zoomLevel);
    
    // 创建临时canvas进行缩放
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = pageData.width;
    tempCanvas.height = pageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(pageData.imageData, 0, 0);
      
      // 在主canvas上绘制缩放后的图像
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      ctx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight);
      
      // 保存图像数据
      const scaledImageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
      if (imageRenderer) {
        (imageRenderer as any).imageData = scaledImageData;
      }
    }
  }

  currentPageDisplay.textContent = pageNum.toString();

  // 清除选区
  selectionRect = null;
  currentSelection = null;
  updateSelectionOutput(null);

  // 回显控件坐标
  renderComponentOverlays();
}

// 更新页面控制按钮状态
function updatePageControls(): void {
  if (!loadedDocument) return;
  prevButton.disabled = currentPageNumber <= 1;
  nextButton.disabled = currentPageNumber >= loadedDocument.totalPages;
}

// 获取鼠标在PDF中的坐标（根据选择的起始位置）
function getPDFCoordinates(event: MouseEvent): Coordinates {
  const rect = canvas.getBoundingClientRect();
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  // 获取当前选择的起始位置
  const origin = originSelect.value;
  let pdfX: number, pdfY: number;
  const factor = renderScale * zoomLevel;

  switch (origin) {
    case 'top-left':
      // 左上角为原点
      pdfX = Math.round(canvasX / factor);
      pdfY = Math.round(canvasY / factor);
      break;
    case 'bottom-left':
      // 左下角为原点（原始的PDF坐标系）
      pdfX = Math.round(canvasX / factor);
      pdfY = Math.round((canvas.height - canvasY) / factor);
      break;
    case 'top-right':
      // 右上角为原点
      pdfX = Math.round((canvas.width - canvasX) / factor);
      pdfY = Math.round(canvasY / factor);
      break;
    case 'bottom-right':
      // 右下角为原点
      pdfX = Math.round((canvas.width - canvasX) / factor);
      pdfY = Math.round((canvas.height - canvasY) / factor);
      break;
    default:
      // 默认为左上角
      pdfX = Math.round(canvasX / factor);
      pdfY = Math.round(canvasY / factor);
  }

  return { x: pdfX, y: pdfY, canvasX: canvasX, canvasY: canvasY };
}

// 获取相对于画布容器的坐标（用于选区覆盖层定位）
function getRelativeCoordinates(event: MouseEvent): RelativeCoordinates {
  const rect = canvas.getBoundingClientRect();
  const relativeX = event.clientX - rect.left;
  const relativeY = event.clientY - rect.top;

  return { x: relativeX, y: relativeY };
}

// 将画布选区坐标转换为PDF坐标（根据选择的起始位置）
function convertCanvasSelectionToPDF(
  canvasX: number,
  canvasY: number,
  width: number,
  height: number
): SelectionRect {
  const origin = originSelect.value;
  let pdfX: number, pdfY: number, pdfWidth: number, pdfHeight: number;
  const factor = renderScale * zoomLevel;

  // 宽度和高度总是正值
  pdfWidth = Math.round(width / factor);
  pdfHeight = Math.round(height / factor);

  switch (origin) {
    case 'top-left':
      // 左上角为原点
      pdfX = Math.round(canvasX / factor);
      pdfY = Math.round(canvasY / factor);
      break;
    case 'bottom-left':
      // 左下角为原点（原始的PDF坐标系）
      pdfX = Math.round(canvasX / factor);
      pdfY = Math.round((canvas.height - canvasY - height) / factor);
      break;
    case 'top-right':
      // 右上角为原点
      pdfX = Math.round((canvas.width - canvasX - width) / factor);
      pdfY = Math.round(canvasY / factor);
      break;
    case 'bottom-right':
      // 右下角为原点
      pdfX = Math.round((canvas.width - canvasX - width) / factor);
      pdfY = Math.round((canvas.height - canvasY - height) / factor);
      break;
    default:
      // 默认为左上角
      pdfX = Math.round(canvasX / factor);
      pdfY = Math.round(canvasY / factor);
  }

  return { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight };
}

// 更新选区显示
function updateSelectionOutput(selection: SelectionRect | null): void {
  if (selection) {
    selectionOutput.textContent = `x: ${selection.x}, y: ${selection.y}, w: ${selection.width}, h: ${selection.height}`;
    selectionOutput.style.display = 'block';
  } else {
    selectionOutput.style.display = 'none';
  }
}

// 绘制选区在画布上
function drawSelection(): void {
  // 先恢复原始图片内容
  if (imageRenderer) {
    imageRenderer.redraw();
  }

  // 如果有选区，绘制选区
  if (selectionRect && selectionRect.width > 0 && selectionRect.height > 0) {
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';

    // 绘制选区矩形
    ctx.fillRect(
      selectionRect.x,
      selectionRect.y,
      selectionRect.width,
      selectionRect.height
    );
    ctx.strokeRect(
      selectionRect.x,
      selectionRect.y,
      selectionRect.width,
      selectionRect.height
    );

    // 重置线条样式
    ctx.setLineDash([]);

    // 绘制调整大小的控制点
    drawResizeHandles();
  }
}

// 绘制调整大小的控制点
function drawResizeHandles(): void {
  if (!selectionRect) return;

  const handleSize = 8;
  const halfHandle = handleSize / 2;

  ctx.fillStyle = '#007bff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  const rect = selectionRect;

  // 绘制8个控制点
  const handles: ResizeHandle[] = [
    // 四个角
    {
      x: rect.x - halfHandle,
      y: rect.y - halfHandle,
      cursor: 'nw-resize',
    },
    {
      x: rect.x + rect.width - halfHandle,
      y: rect.y - halfHandle,
      cursor: 'ne-resize',
    },
    {
      x: rect.x - halfHandle,
      y: rect.y + rect.height - halfHandle,
      cursor: 'sw-resize',
    },
    {
      x: rect.x + rect.width - halfHandle,
      y: rect.y + rect.height - halfHandle,
      cursor: 'se-resize',
    },
    // 四个边的中点
    {
      x: rect.x + rect.width / 2 - halfHandle,
      y: rect.y - halfHandle,
      cursor: 'n-resize',
    },
    {
      x: rect.x + rect.width / 2 - halfHandle,
      y: rect.y + rect.height - halfHandle,
      cursor: 's-resize',
    },
    {
      x: rect.x - halfHandle,
      y: rect.y + rect.height / 2 - halfHandle,
      cursor: 'w-resize',
    },
    {
      x: rect.x + rect.width - halfHandle,
      y: rect.y + rect.height / 2 - halfHandle,
      cursor: 'e-resize',
    },
  ];

  handles.forEach((handle) => {
    ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
  });
}

// 检测鼠标是否在调整大小的控制点上
function getResizeDirection(x: number, y: number): string {
  if (!selectionRect) return '';

  const handleSize = 8;
  const halfHandle = handleSize / 2;
  const rect = selectionRect;

  // 检查各个控制点
  const handles: Array<{ x: number; y: number; direction: string }> = [
    { x: rect.x - halfHandle, y: rect.y - halfHandle, direction: 'nw' },
    {
      x: rect.x + rect.width - halfHandle,
      y: rect.y - halfHandle,
      direction: 'ne',
    },
    {
      x: rect.x - halfHandle,
      y: rect.y + rect.height - halfHandle,
      direction: 'sw',
    },
    {
      x: rect.x + rect.width - halfHandle,
      y: rect.y + rect.height - halfHandle,
      direction: 'se',
    },
    {
      x: rect.x + rect.width / 2 - halfHandle,
      y: rect.y - halfHandle,
      direction: 'n',
    },
    {
      x: rect.x + rect.width / 2 - halfHandle,
      y: rect.y + rect.height - halfHandle,
      direction: 's',
    },
    {
      x: rect.x - halfHandle,
      y: rect.y + rect.height / 2 - halfHandle,
      direction: 'w',
    },
    {
      x: rect.x + rect.width - halfHandle,
      y: rect.y + rect.height / 2 - halfHandle,
      direction: 'e',
    },
  ];

  for (let handle of handles) {
    if (
      x >= handle.x &&
      x <= handle.x + handleSize &&
      y >= handle.y &&
      y <= handle.y + handleSize
    ) {
      return handle.direction;
    }
  }

  return '';
}

// 根据调整方向设置光标样式
function setCursorForResize(direction: string): void {
  const cursorMap: Record<string, string> = {
    nw: 'nw-resize',
    ne: 'ne-resize',
    sw: 'sw-resize',
    se: 'se-resize',
    n: 'n-resize',
    s: 's-resize',
    w: 'w-resize',
    e: 'e-resize',
  };

  canvas.style.cursor = cursorMap[direction] || 'crosshair';
}

// 鼠标按下事件 - 开始框选
canvas.addEventListener('mousedown', function (event: MouseEvent) {
  if (event.button === 0) {
    // 左键
    const coords = getRelativeCoordinates(event);

    // 首先检查是否点击在调整大小的控制点上
    const resizeDir = getResizeDirection(coords.x, coords.y);
    if (resizeDir) {
      // 开始调整选区大小
      isResizingSelection = true;
      resizeDirection = resizeDir;
      dragStartX = coords.x;
      dragStartY = coords.y;
      originalSelectionRect = selectionRect ? { ...selectionRect } : null;
      setCursorForResize(resizeDir);
    } else if (
      selectionRect &&
      coords.x >= selectionRect.x &&
      coords.x <= selectionRect.x + selectionRect.width &&
      coords.y >= selectionRect.y &&
      coords.y <= selectionRect.y + selectionRect.height
    ) {
      // 开始拖动选区
      isDraggingSelection = true;
      dragStartX = coords.x;
      dragStartY = coords.y;
      selectionStartX = selectionRect.x;
      selectionStartY = selectionRect.y;
      canvas.style.cursor = 'move';
    } else {
      // 点击选区外面，不删除选区，而是开始创建新选区
      isSelecting = true;
      startX = coords.x;
      startY = coords.y;
      // 保持现有选区，只是准备创建新的
    }

    event.preventDefault();
  }
});

// 鼠标移动事件
canvas.addEventListener('mousemove', function (event: MouseEvent) {
  const relativeCoords = getRelativeCoordinates(event);
  const coords = getPDFCoordinates(event);
  
  // 显示原始坐标和画布坐标
  coordinateOutput.textContent = `原始: x: ${coords.x}, y: ${coords.y} | 画布: x: ${Math.round(coords.canvasX || 0)}, y: ${Math.round(coords.canvasY || 0)}`;

  // 如果没有任何操作进行中，检查光标样式
  if (!isSelecting && !isDraggingSelection && !isResizingSelection) {
    const resizeDir = getResizeDirection(relativeCoords.x, relativeCoords.y);
    if (resizeDir) {
      setCursorForResize(resizeDir);
    } else if (
      selectionRect &&
      relativeCoords.x >= selectionRect.x &&
      relativeCoords.x <= selectionRect.x + selectionRect.width &&
      relativeCoords.y >= selectionRect.y &&
      relativeCoords.y <= selectionRect.y + selectionRect.height
    ) {
      canvas.style.cursor = 'move';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }

  if (isSelecting) {
    // 创建选区 - 显示临时选区
    const currentX = relativeCoords.x;
    const currentY = relativeCoords.y;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // 先恢复原始图片内容
    if (imageRenderer) {
      imageRenderer.redraw();
    }

    // 绘制现有选区（如果有）
    if (selectionRect && selectionRect.width > 0 && selectionRect.height > 0) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';

      ctx.fillRect(
        selectionRect.x,
        selectionRect.y,
        selectionRect.width,
        selectionRect.height
      );
      ctx.strokeRect(
        selectionRect.x,
        selectionRect.y,
        selectionRect.width,
        selectionRect.height
      );
    }

    // 绘制临时选区
    if (width > 0 && height > 0) {
      ctx.strokeStyle = '#ff6b6b'; // 红色表示临时选区
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';

      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
    }

    // 重置线条样式
    ctx.setLineDash([]);
  } else if (isDraggingSelection && selectionRect) {
    // 拖动选区
    const deltaX = relativeCoords.x - dragStartX;
    const deltaY = relativeCoords.y - dragStartY;

    let newX = selectionStartX + deltaX;
    let newY = selectionStartY + deltaY;

    // 边界检查
    newX = Math.max(0, Math.min(newX, canvas.width - selectionRect.width));
    newY = Math.max(0, Math.min(newY, canvas.height - selectionRect.height));

    selectionRect.x = newX;
    selectionRect.y = newY;

    drawSelection();

    // 更新PDF坐标显示
    const selectionCoords = convertCanvasSelectionToPDF(
      newX,
      newY,
      selectionRect.width,
      selectionRect.height
    );

    currentSelection = {
      x: selectionCoords.x,
      y: selectionCoords.y,
      width: selectionCoords.width,
      height: selectionCoords.height,
    };
    updateSelectionOutput(currentSelection);
  } else if (isResizingSelection && originalSelectionRect) {
    // 调整选区大小
    const deltaX = relativeCoords.x - dragStartX;
    const deltaY = relativeCoords.y - dragStartY;

    let newRect = { ...originalSelectionRect };

    // 根据调整方向更新选区
    if (resizeDirection.includes('n')) {
      // 上边
      newRect.y = originalSelectionRect.y + deltaY;
      newRect.height = originalSelectionRect.height - deltaY;
    }
    if (resizeDirection.includes('s')) {
      // 下边
      newRect.height = originalSelectionRect.height + deltaY;
    }
    if (resizeDirection.includes('w')) {
      // 左边
      newRect.x = originalSelectionRect.x + deltaX;
      newRect.width = originalSelectionRect.width - deltaX;
    }
    if (resizeDirection.includes('e')) {
      // 右边
      newRect.width = originalSelectionRect.width + deltaX;
    }

    // 确保最小尺寸和边界
    newRect.width = Math.max(10, newRect.width);
    newRect.height = Math.max(10, newRect.height);
    newRect.x = Math.max(0, Math.min(newRect.x, canvas.width - newRect.width));
    newRect.y = Math.max(
      0,
      Math.min(newRect.y, canvas.height - newRect.height)
    );

    selectionRect = newRect;
    drawSelection();

    // 更新PDF坐标显示
    const selectionCoords = convertCanvasSelectionToPDF(
      newRect.x,
      newRect.y,
      newRect.width,
      newRect.height
    );

    currentSelection = {
      x: selectionCoords.x,
      y: selectionCoords.y,
      width: selectionCoords.width,
      height: selectionCoords.height,
    };
    updateSelectionOutput(currentSelection);
  }
});

// 鼠标抬起事件 - 完成框选或拖动
canvas.addEventListener('mouseup', function (event: MouseEvent) {
  if (event.button === 0) {
    // 左键
    if (isSelecting) {
      // 完成选区创建
      isSelecting = false;

      const relativeCoords = getRelativeCoordinates(event);
      const endX = relativeCoords.x;
      const endY = relativeCoords.y;

      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      if (width > 3 && height > 3) {
        // 创建新选区，替换现有选区
        selectionRect = { x: x, y: y, width: width, height: height };

        // 转换为PDF坐标系（使用当前选择的起始位置）
        const selectionCoords = convertCanvasSelectionToPDF(
          x,
          y,
          width,
          height
        );

        currentSelection = {
          x: selectionCoords.x,
          y: selectionCoords.y,
          width: selectionCoords.width,
          height: selectionCoords.height,
        };
        updateSelectionOutput(currentSelection);
      }

      // 重新绘制（清除临时选区）
      drawSelection();
      updateContextInputFromSelection();
    } else if (isDraggingSelection) {
      // 完成选区拖动
      isDraggingSelection = false;
      canvas.style.cursor = 'crosshair';
      updateContextInputFromSelection();
    } else if (isResizingSelection) {
      // 完成选区调整大小
      isResizingSelection = false;
      resizeDirection = '';
      originalSelectionRect = null;
      canvas.style.cursor = 'crosshair';
      updateContextInputFromSelection();
    }
  }
});

// 鼠标离开canvas时保持最后坐标，但停止所有操作
canvas.addEventListener('mouseleave', function () {
  // 不重置坐标显示，保持最后一个坐标
  if (isSelecting) {
    isSelecting = false;
    // 重新绘制，清除临时选区但保留现有选区
    drawSelection();
  }
  if (isDraggingSelection) {
    isDraggingSelection = false;
    canvas.style.cursor = 'crosshair';
  }
  if (isResizingSelection) {
    isResizingSelection = false;
    resizeDirection = '';
    originalSelectionRect = null;
    canvas.style.cursor = 'crosshair';
  }
});

// 双击清除选区
canvas.addEventListener('dblclick', function () {
  selectionRect = null;
  currentSelection = null;
  updateSelectionOutput(null);
  drawSelection();
});

// 页面控制
prevButton.addEventListener('click', async function () {
  if (loadedDocument && currentPageNumber > 1) {
    currentPageNumber--;
    await renderPage(currentPageNumber);
    updatePageControls();
  }
});

nextButton.addEventListener('click', async function () {
  if (loadedDocument && currentPageNumber < loadedDocument.totalPages) {
    currentPageNumber++;
    await renderPage(currentPageNumber);
    updatePageControls();
  }
});

// 键盘控制
document.addEventListener('keydown', function (event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    prevButton.click();
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextButton.click();
  }
});

// 文件选择功能
fileSelectorButton.addEventListener('click', function () {
  fileInput.click();
});

fileInput.addEventListener('change', function (event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    loadFile(file);
  }
});

// 起始位置改变事件
originSelect.addEventListener('change', function () {
  // 如果有选区，重新计算并更新显示
  if (selectionRect && currentSelection) {
    const selectionCoords = convertCanvasSelectionToPDF(
      selectionRect.x,
      selectionRect.y,
      selectionRect.width,
      selectionRect.height
    );

    currentSelection = {
      x: selectionCoords.x,
      y: selectionCoords.y,
      width: selectionCoords.width,
      height: selectionCoords.height,
    };
    updateSelectionOutput(currentSelection);
  }

  // 回显控件跟随坐标原点变化
  renderComponentOverlays();
});

// 复制到剪贴板功能
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// 显示复制成功提示
function showCopySuccess(element: HTMLElement, originalText: string): void {
  const originalBg = element.style.background;
  element.style.background = '#28a745';
  element.textContent = '已复制!';

  setTimeout(() => {
    element.style.background = originalBg;
    element.textContent = originalText;
  }, 500);
}


// 选区复制事件
selectionOutput.addEventListener('click', async function () {
  if (currentSelection) {
    const clipboardText = `{x: ${currentSelection.x}, y: ${currentSelection.y}, w: ${currentSelection.width}, h: ${currentSelection.height}}`;
    const originalText = selectionOutput.textContent || '';

    const success = await copyToClipboard(clipboardText);
    if (success) {
      showCopySuccess(selectionOutput, originalText);
    }
  }
});

// 坐标复制事件
coordinateOutput.addEventListener('click', async function () {
  const text = coordinateOutput.textContent || '';
  const match = text.match(/原始: x: (-?\d+), y: (-?\d+)/);
  if (match) {
    const clipboardText = `{x: ${match[1]}, y: ${match[2]}}`;
    const success = await copyToClipboard(clipboardText);
    if (success) {
      showCopySuccess(coordinateOutput, text);
    }
  }
});

// 缩放功能
function updateZoomLevel(newZoom: number): void {
  zoomLevel = Math.max(0.25, Math.min(4, newZoom)); // 限制在0.25到4之间
  zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
  
  if (loadedDocument && currentPageNumber) {
    renderPage(currentPageNumber);
  }
}

zoomInButton.addEventListener('click', function () {
  updateZoomLevel(zoomLevel + 0.25);
});

zoomOutButton.addEventListener('click', function () {
  updateZoomLevel(zoomLevel - 0.25);
});

zoomResetButton.addEventListener('click', function () {
  updateZoomLevel(1.0);
});

// 鼠标滚轮缩放
canvas.addEventListener('wheel', function (event: WheelEvent) {
  if (event.ctrlKey) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    updateZoomLevel(zoomLevel + delta);
  }
});

// 页面加载完成后的初始化
window.addEventListener('load', function () {
  initializeModules();
  loadContextsFromUrl();
  bindContextInputUi();
  console.log('坐标工具已就绪，请选择文件');
});
