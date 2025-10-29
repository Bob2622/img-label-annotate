# React Image Annotate 集成演示

## 项目说明

本分支演示了如何在图片标注平台中集成开源标注库 `react-image-annotate`。

### 技术栈

- **React 18** + TypeScript + Vite
- **Ant Design 5** - UI 组件库
- **react-image-annotate** - 开源标注组件

---

## 已实现功能

### ✅ 核心功能

1. **多框标注** - 支持在一张图片上绘制多个矩形框
2. **异常类型管理** - 支持选择和新增异常类型
3. **坐标自动转换** - 像素坐标与归一化坐标自动转换
4. **数据持久化** - 标注数据自动保存到 localStorage
5. **导入导出** - 支持 JSON 格式导出标注数据

### 🎯 满足会议需求

| 需求项 | 实现情况 | 说明 |
|-------|---------|------|
| 矩形框标注 | ✅ 完成 | 使用 react-image-annotate 内置功能 |
| 多框标注 | ✅ 完成 | 可在单图上绘制多个框 |
| 坐标返回 | ✅ 完成 | 自动转换为像素坐标 |
| 异常类型 | ✅ 完成 | 支持选择和动态新增 |
| 数据集管理 | ✅ 完成 | 复用原有功能 |

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

⚠️ **注意**: `react-image-annotate` 依赖 React 16,但在 React 18 中使用 `--legacy-peer-deps` 也能正常运行。

### 2. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:5173 (如果端口被占用会自动切换)

### 3. 使用流程

1. **创建数据集** - 在"数据集"页面点击"新建数据集"
2. **导入图片** - 点击"导入图片"上传本地图片
3. **开始标注** - 点击"标注"进入标注页面
4. **绘制标注框** - 在图片上拖拽鼠标绘制矩形框
5. **保存** - 点击右上角"完成"按钮保存

---

## 项目结构

```
src/
├── components/
│   └── ImageAnnotator.tsx      # react-image-annotate 封装组件
├── pages/
│   ├── DatasetPage.tsx         # 数据集管理页面
│   └── LabelingPage.tsx        # 标注页面(已改造)
├── store.ts                     # 全局状态管理
└── types.ts                     # 类型定义
```

### 核心代码

#### ImageAnnotator 组件

封装了 `react-image-annotate`,提供以下功能:

- 坐标格式转换(像素 ↔ 归一化)
- 异常类型选择
- 多框标注支持
- 标注数据保存

```typescript
<ImageAnnotator
  imageUrl={image.url}
  imageName={image.filename}
  exceptionType="图文不匹配"
  exceptionTypes={['图文不匹配', '文本重叠', '黑屏']}
  initialRegions={boxes}
  onSave={handleSave}
  naturalWidth={image.width}
  naturalHeight={image.height}
/>
```

---

## 数据格式

### Box 数据结构

```typescript
interface Box {
  id: string;           // 唯一标识
  x: number;            // 左上角 x 坐标(像素)
  y: number;            // 左上角 y 坐标(像素)
  width: number;        // 宽度(像素)
  height: number;       // 高度(像素)
  label?: string;       // 标签/异常类型
}
```

### 导出 JSON 格式

```json
{
  "dataset": "数据集名称",
  "image": "图片文件名.jpg",
  "exceptionType": "图文不匹配",
  "boxes": [
    {
      "id": "abc12345",
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 150,
      "label": "图文不匹配"
    }
  ]
}
```

---

## 技术亮点

### 1. 坐标转换逻辑

`react-image-annotate` 使用归一化坐标 (0-1),我们的系统使用像素坐标:

```typescript
// 像素 → 归一化
const region = {
  x: box.x / naturalWidth,
  y: box.y / naturalHeight,
  w: box.width / naturalWidth,
  h: box.height / naturalHeight,
};

// 归一化 → 像素
const box = {
  x: Math.round(region.x * naturalWidth),
  y: Math.round(region.y * naturalHeight),
  width: Math.round(region.w * naturalWidth),
  height: Math.round(region.h * naturalHeight),
};
```

### 2. 组件重新挂载策略

使用 `key` 属性强制组件重新挂载,确保状态正确更新:

```typescript
<ImageAnnotator
  key={`${image.id}-${selectedExceptionType}`}
  // ...
/>
```

### 3. 异常类型动态管理

支持预置类型 + 动态新增:

```typescript
const PRESET_EXCEPTION_TYPES = ['图文不匹配', '文本重叠', '黑屏', '白屏'];
const [exceptionTypes, setExceptionTypes] = useState(PRESET_EXCEPTION_TYPES);
```

---

## 已知问题与改进

### ⚠️ 当前限制

1. **React 版本兼容性** - `react-image-annotate` 基于 React 16,在 React 18 中需要 `--legacy-peer-deps`
2. **老旧依赖警告** - 安装时会有大量 deprecated 警告(不影响使用)
3. **UI 样式** - 标注器 UI 可能与 Ant Design 风格不统一

### 🔧 可优化方向

1. **自定义标注器** - 如果需要更深度定制,可考虑自研标注组件
2. **迁移到新版本** - 寻找更现代的标注库(如 Annotate Lab)
3. **性能优化** - 大图片(>4000px)的标注性能优化
4. **标注历史** - 添加撤销/重做功能

---

## 对比原实现

| 维度 | 原实现 | react-image-annotate |
|------|--------|---------------------|
| 开发复杂度 | 高(自研) | 低(开箱即用) |
| 代码量 | ~500行 | ~100行 |
| 功能完整度 | 基础功能 | 功能丰富 |
| 维护成本 | 高 | 低 |
| 定制灵活性 | 高 | 中 |

---

## 相关资源

- [react-image-annotate GitHub](https://github.com/UniversalDataTool/react-image-annotate)
- [在线演示](https://universaldatatool.github.io/react-image-annotate/)
- [NPM 文档](https://www.npmjs.com/package/react-image-annotate)

---

## 下一步计划

1. ✅ ~~集成 react-image-annotate~~
2. ✅ ~~实现多框标注~~
3. ✅ ~~坐标转换~~
4. ⏳ 添加标注历史记录
5. ⏳ 集成后端 API
6. ⏳ 用户权限管理
7. ⏳ 生产环境部署

---

## 贡献者

- 集成方案设计与实现
- 基于2025-10-29会议需求开发

---

## License

MIT
