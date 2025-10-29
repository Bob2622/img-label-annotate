import React from 'react';
import ReactImageAnnotate from 'react-image-annotate';
import type { Box } from '../types';

export interface ImageAnnotatorProps {
  /**图片 URL */
  imageUrl: string;
  /** 图片文件名 */
  imageName: string;
  /** 当前异常类型 */
  exceptionType: string;
  /** 所有可用的异常类型列表 */
  exceptionTypes: string[];
  /** 初始标注框数据 */
  initialRegions?: Box[];
  /** 保存回调 */
  onSave: (regions: Box[]) => void;
  /** 图片自然尺寸 */
  naturalWidth?: number;
  naturalHeight?: number;
}

/**
 * 图片标注组件
 * 基于 react-image-annotate 封装
 * 支持多框标注
 */
export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  imageUrl,
  imageName,
  exceptionType,
  exceptionTypes,
  initialRegions = [],
  onSave,
  naturalWidth,
  naturalHeight,
}) => {
  // 将 Box 格式转换为 react-image-annotate 的 region 格式
  const convertBoxToRegion = (box: Box) => {
    if (!naturalWidth || !naturalHeight) return null;

    return {
      id: box.id,
      type: 'box',
      x: box.x / naturalWidth,      // 转换为比例 0-1
      y: box.y / naturalHeight,
      w: box.width / naturalWidth,
      h: box.height / naturalHeight,
      cls: box.label || exceptionType,
      highlighted: false,
    };
  };

  // 将 react-image-annotate 的 region 格式转换为 Box 格式
  const convertRegionToBox = (region: any): Box => {
    if (!naturalWidth || !naturalHeight) {
      return {
        id: region.id,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        label: region.cls,
      };
    }

    return {
      id: region.id,
      x: Math.round(region.x * naturalWidth),      // 转换回像素坐标
      y: Math.round(region.y * naturalHeight),
      width: Math.round(region.w * naturalWidth),
      height: Math.round(region.h * naturalHeight),
      label: region.cls,
    };
  };

  const regions = initialRegions
    .map(convertBoxToRegion)
    .filter(Boolean);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactImageAnnotate
        taskDescription={`标注异常类型: ${exceptionType}`}
        labelImages
        regionClsList={exceptionTypes}
        enabledTools={['create-box', 'select']}
        images={[
          {
            src: imageUrl,
            name: imageName,
            regions: regions,
          },
        ]}
        onExit={(output: any) => {
          const outputImage = output.images?.[0];
          if (outputImage && outputImage.regions) {
            const boxes = outputImage.regions.map(convertRegionToBox);
            onSave(boxes);
          }
        }}
      />
    </div>
  );
};
