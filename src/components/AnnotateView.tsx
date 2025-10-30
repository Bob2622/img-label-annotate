import React, { useState, useMemo } from 'react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  ForwardOutlined,
} from '@ant-design/icons';
import type { Dataset, ImageItem, AnnotationStatus, ExceptionAnnotation } from '../types';
import { appStore } from '../store';
import { ImageAnnotator } from './ImageAnnotator';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import './AnnotateView.scss';
import { message } from 'antd';

interface AnnotateViewProps {
  image: ImageItem;
  dataset: Dataset;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

export function AnnotateView({ image, dataset, onClose, onNavigate }: AnnotateViewProps) {
  // 获取异常类型
  const exceptionTypes = useMemo(() => appStore.getExceptionTypes(), []);
  const [selectedExceptionType, setSelectedExceptionType] = useState(
    exceptionTypes[0]?.name || ''
  );

  // 获取当前标注
  const currentAnnotation = useMemo(() => {
    if (!selectedExceptionType) return null;
    return appStore.getImageExceptionAnnotation(image.id, selectedExceptionType);
  }, [image.id, selectedExceptionType]);

  // 标注状态
  const [boxes, setBoxes] = useState(currentAnnotation?.boxes || []);
  const [category, setCategory] = useState(currentAnnotation?.category || '');
  const [label, setLabel] = useState(currentAnnotation?.label || '');
  const [remark, setRemark] = useState(currentAnnotation?.remark || '');

  // 计算进度
  const imageIndex = dataset.images.findIndex((img) => img.id === image.id);
  const progress = `${imageIndex + 1}/${dataset.images.length}`;

  // 保存标注
  const handleSave = (status: AnnotationStatus) => {
    if (!selectedExceptionType) {
      message.warning('请选择异常类型');
      return;
    }

    const annotation: ExceptionAnnotation = {
      exceptionType: selectedExceptionType,
      status,
      boxes,
      category: category.trim(),
      label: label.trim(),
      remark: remark.trim(),
    };

    appStore.saveImageExceptionAnnotation(image.id, dataset.id, annotation);
    message.success('已保存');
  };

  // 保存并跳转到下一张
  const handleSaveAndNext = (status: AnnotationStatus) => {
    handleSave(status);
    setTimeout(() => onNavigate('next'), 300);
  };

  // 快捷键
  useKeyboardShortcuts({
    ArrowLeft: () => onNavigate('previous'),
    ArrowRight: () => onNavigate('next'),
    Escape: onClose,
    s: () => handleSaveAndNext('正确'),
    d: () => handleSaveAndNext('错误'),
    f: () => onNavigate('next'), // 跳过
    Enter: () => handleSaveAndNext('正确'),
  });

  return (
    <div className="annotate-view">
      {/* 顶部工具栏(毛玻璃) */}
      <div className="annotate-topbar glass-panel">
        <div className="topbar-left">
          <button className="nav-btn" onClick={() => onNavigate('previous')}>
            <ArrowLeftOutlined />
          </button>
          <button className="nav-btn" onClick={() => onNavigate('next')}>
            <ArrowRightOutlined />
          </button>

          <span className="image-name">{image.filename}</span>
          <span className="progress-badge">{progress}</span>
        </div>

        <div className="topbar-right">
          <button className="close-btn" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* Canvas 画布区域 */}
      <div className="annotate-canvas">
        <ImageAnnotator
          imageUrl={image.url}
          imageName={image.filename}
          initialBoxes={boxes}
          onSave={setBoxes}
        />
      </div>

      {/* 底部操作栏(毛玻璃) */}
      <div className="annotate-bottombar glass-panel">
        <div className="bottombar-left">
          <select
            className="exception-select"
            value={selectedExceptionType}
            onChange={(e) => setSelectedExceptionType(e.target.value)}
          >
            {exceptionTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>

          <input
            className="category-input"
            type="text"
            placeholder="类别(可选)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            className="label-input"
            type="text"
            placeholder="标签(可选)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          <textarea
            className="remark-input"
            placeholder="备注/思维链(可选)"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
          />
        </div>

        <div className="bottombar-center">
          <button className="action-btn btn-correct" onClick={() => handleSaveAndNext('正确')}>
            <CheckOutlined />
            <span>正确</span>
            <kbd>S</kbd>
          </button>

          <button className="action-btn btn-incorrect" onClick={() => handleSaveAndNext('错误')}>
            <CloseCircleOutlined />
            <span>错误</span>
            <kbd>D</kbd>
          </button>

          <button className="action-btn btn-skip" onClick={() => onNavigate('next')}>
            <ForwardOutlined />
            <span>跳过</span>
            <kbd>F</kbd>
          </button>
        </div>

        <div className="bottombar-right">
          <div className="box-count">
            已绘制 <strong>{boxes.length}</strong> 个框
          </div>
        </div>
      </div>
    </div>
  );
}
