// 数据集状态
export type DatasetStatus = '准备中' | '已完成' | '进行中';

// 标注框
export type Box = {
  id: string;
  x: number; // left in px relative to image natural size
  y: number; // top in px
  width: number; // in px
  height: number; // in px
};

// 图片项
export type ImageItem = {
  id: string;
  filename: string;
  url: string; // data URL
  width?: number;
  height?: number;
};

// 数据集
export type Dataset = {
  id: string;
  name: string;
  status: DatasetStatus;
  images: ImageItem[];
};

// 标注状态
export type AnnotationStatus = '未标注' | '正确' | '错误';

// 单个异常类型下的标注数据
export type ExceptionAnnotation = {
  exceptionType: string; // 异常类型名称
  status: AnnotationStatus; // 标注状态
  boxes: Box[]; // 标注框数组(支持多框)
  category?: string; // 类别(用户自定义,如 true/false)
  label?: string; // 标签(用户填写)
  remark?: string; // 备注(标注理由)
};

// 单张图片的完整标注数据
export type ImageAnnotations = {
  imageId: string;
  datasetId: string;
  annotations: ExceptionAnnotation[]; // 每个异常类型一个标注记录
};

// 全局标注数据存储
export type AnnotationStore = {
  // imageId -> ImageAnnotations
  [imageId: string]: ImageAnnotations;
};

// 异常类型管理
export type ExceptionType = {
  id: string;
  name: string;
  preset: boolean; // 是否为预置类型
};

// 持久化状态
export type PersistState = {
  datasets: Dataset[];
  annotations: AnnotationStore;
  exceptionTypes: ExceptionType[]; // 全局异常类型列表
};

export const PERSIST_KEY = 'imglabel_data_v2'; // 版本升级

