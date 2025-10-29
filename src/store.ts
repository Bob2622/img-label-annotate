import { nanoid } from "nanoid/non-secure";
import {
  AnnotationStore,
  Dataset,
  PersistState,
  PERSIST_KEY,
  ExceptionType,
  ExceptionAnnotation,
  ImageAnnotations,
} from "./types";

type Listener = () => void;

// 预置异常类型
const PRESET_EXCEPTION_TYPES: ExceptionType[] = [
  { id: "preset_1", name: "图文不匹配", preset: true },
  { id: "preset_2", name: "文本重叠", preset: true },
];

class AppStore {
  private state: PersistState;
  private listeners: Listener[] = [];

  constructor() {
    this.state = this.load();
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private load(): PersistState {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw)
        return {
          datasets: [],
          annotations: {},
          exceptionTypes: PRESET_EXCEPTION_TYPES,
        };
      const parsed = JSON.parse(raw) as PersistState;
      // 确保包含预置类型
      if (!parsed.exceptionTypes) {
        parsed.exceptionTypes = PRESET_EXCEPTION_TYPES;
      }
      return parsed;
    } catch {
      return {
        datasets: [],
        annotations: {},
        exceptionTypes: PRESET_EXCEPTION_TYPES,
      };
    }
  }

  private save() {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(this.state));
  }

  getState(): PersistState {
    return this.state;
  }

  // ===== 数据集管理 =====

  addDataset(name: string): Dataset {
    const dataset: Dataset = {
      id: nanoid(8),
      name,
      status: "准备中",
      images: [],
    };
    this.state.datasets.push(dataset);
    this.save();
    this.emit();
    return dataset;
  }

  updateDataset(datasetId: string, name: string) {
    const ds = this.state.datasets.find((d) => d.id === datasetId);
    if (!ds) return;
    ds.name = name;
    this.save();
    this.emit();
  }

  deleteDataset(datasetId: string) {
    this.state.datasets = this.state.datasets.filter(
      (d) => d.id !== datasetId
    );
    // 同时删除该数据集下所有图片的标注
    Object.keys(this.state.annotations).forEach((imageId) => {
      if (this.state.annotations[imageId].datasetId === datasetId) {
        delete this.state.annotations[imageId];
      }
    });
    this.save();
    this.emit();
  }

  addImages(datasetId: string, files: File[]): Promise<void> {
    const dataset = this.state.datasets.find((d) => d.id === datasetId);
    if (!dataset) return Promise.resolve();
    const readers = files.map(
      (file) =>
        new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const url = String(reader.result);
            const img = new Image();
            img.onload = () => {
              dataset.images.push({
                id: nanoid(10),
                filename: file.name,
                url,
                width: img.width,
                height: img.height,
              });
              resolve();
            };
            img.src = url;
          };
          reader.readAsDataURL(file);
        })
    );
    return Promise.all(readers).then(() => {
      dataset.status = dataset.images.length > 0 ? "进行中" : "准备中";
      this.save();
      this.emit();
    });
  }

  setDatasetStatus(datasetId: string, status: Dataset["status"]) {
    const ds = this.state.datasets.find((d) => d.id === datasetId);
    if (!ds) return;
    ds.status = status;
    this.save();
    this.emit();
  }

  // ===== 异常类型管理 =====

  addExceptionType(name: string): ExceptionType {
    const type: ExceptionType = {
      id: nanoid(8),
      name,
      preset: false,
    };
    this.state.exceptionTypes.push(type);
    this.save();
    this.emit();
    return type;
  }

  getExceptionTypes(): ExceptionType[] {
    return this.state.exceptionTypes;
  }

  // ===== 标注数据管理 =====

  // 获取图片的所有标注
  getImageAnnotations(imageId: string): ImageAnnotations | null {
    return this.state.annotations[imageId] || null;
  }

  // 获取图片在特定异常类型下的标注
  getImageExceptionAnnotation(
    imageId: string,
    exceptionType: string
  ): ExceptionAnnotation | null {
    const imgAnn = this.state.annotations[imageId];
    if (!imgAnn) return null;
    return (
      imgAnn.annotations.find((a) => a.exceptionType === exceptionType) || null
    );
  }

  // 保存图片在特定异常类型下的标注
  saveImageExceptionAnnotation(
    imageId: string,
    datasetId: string,
    annotation: ExceptionAnnotation
  ) {
    if (!this.state.annotations[imageId]) {
      this.state.annotations[imageId] = {
        imageId,
        datasetId,
        annotations: [],
      };
    }

    const imgAnn = this.state.annotations[imageId];
    const index = imgAnn.annotations.findIndex(
      (a) => a.exceptionType === annotation.exceptionType
    );

    if (index >= 0) {
      imgAnn.annotations[index] = annotation;
    } else {
      imgAnn.annotations.push(annotation);
    }

    this.save();
    this.emit();
  }

  // 导出标注数据(JSON 格式)
  exportAnnotations(datasetId: string) {
    const dataset = this.state.datasets.find((d) => d.id === datasetId);
    if (!dataset) return;

    const exportData = {
      dataset: dataset.name,
      exportTime: new Date().toISOString(),
      images: dataset.images.map((img) => {
        const annotations = this.state.annotations[img.id] || null;
        return {
          id: img.id,
          filename: img.filename,
          width: img.width,
          height: img.height,
          annotations: annotations?.annotations || [],
        };
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset.name}_annotations_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const appStore = new AppStore();
export { nanoid };
