export type DatasetStatus = '准备中' | '已完成' | '进行中';

export type Box = {
  id: string;
  x: number; // left in px relative to image natural size
  y: number; // top in px
  width: number; // in px
  height: number; // in px
  label?: string;
};

export type ImageItem = {
  id: string;
  filename: string;
  url: string; // data URL
  width?: number;
  height?: number;
};

export type Dataset = {
  id: string;
  name: string;
  status: DatasetStatus;
  images: ImageItem[];
};

export type AnnotationStore = {
  // imageId -> boxes
  [imageId: string]: Box[];
};

export type PersistState = {
  datasets: Dataset[];
  annotations: AnnotationStore;
};

export const PERSIST_KEY = 'imglabel_data_v1';

