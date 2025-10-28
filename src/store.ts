import { nanoid } from "nanoid/non-secure";
import { AnnotationStore, Dataset, PersistState, PERSIST_KEY } from "./types";

type Listener = () => void;

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
      if (!raw) return { datasets: [], annotations: {} };
      const parsed = JSON.parse(raw) as PersistState;
      return parsed;
    } catch {
      return { datasets: [], annotations: {} };
    }
  }

  private save() {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(this.state));
  }

  getState(): PersistState {
    return this.state;
  }

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

  getImageBoxes(imageId: string) {
    return this.state.annotations[imageId] ?? [];
  }

  setImageBoxes(imageId: string, boxes: AnnotationStore[string]) {
    this.state.annotations[imageId] = boxes;
    this.save();
    this.emit();
  }
}

export const appStore = new AppStore();
export { nanoid };
