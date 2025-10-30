import React, { useState, useMemo } from 'react';
import { CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { Dataset, ImageItem } from '../types';
import { appStore } from '../store';
import { ExceptionTypeManager } from './ExceptionTypeManager';
import './GalleryView.scss';

interface GalleryViewProps {
  dataset: Dataset;
  onImageClick: (image: ImageItem) => void;
}

export function GalleryView({ dataset, onImageClick }: GalleryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'labeled' | 'unlabeled'>('all');
  const [showTypeManager, setShowTypeManager] = useState(false);

  // 获取异常类型
  const exceptionTypes = useMemo(() => appStore.getExceptionTypes(), []);
  const [selectedExceptionType, setSelectedExceptionType] = useState(
    exceptionTypes[0]?.name || ''
  );

  // 筛选图片
  const filteredImages = useMemo(() => {
    return dataset.images.filter((img) => {
      // 按名称搜索
      if (searchQuery && !img.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 按状态筛选
      if (filterStatus !== 'all' && selectedExceptionType) {
        const annotation = appStore.getImageExceptionAnnotation(img.id, selectedExceptionType);
        if (filterStatus === 'labeled' && (!annotation || annotation.status === '未标注')) {
          return false;
        }
        if (filterStatus === 'unlabeled' && annotation && annotation.status !== '未标注') {
          return false;
        }
      }

      return true;
    });
  }, [dataset.images, searchQuery, filterStatus, selectedExceptionType]);

  // 获取图片状态
  const getImageStatus = (image: ImageItem) => {
    if (!selectedExceptionType) return 'unlabeled';
    const annotation = appStore.getImageExceptionAnnotation(image.id, selectedExceptionType);
    if (!annotation || annotation.status === '未标注') return 'unlabeled';
    return annotation.status === '正确' ? 'correct' : 'incorrect';
  };

  // 获取标注框数量
  const getBoxCount = (image: ImageItem) => {
    if (!selectedExceptionType) return 0;
    const annotation = appStore.getImageExceptionAnnotation(image.id, selectedExceptionType);
    return annotation?.boxes.length || 0;
  };

  return (
    <div className="gallery-view">
      {/* 工具栏 */}
      <div className="gallery-toolbar">
        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={selectedExceptionType}
            onChange={(e) => setSelectedExceptionType(e.target.value)}
          >
            {exceptionTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">全部</option>
            <option value="labeled">已标注</option>
            <option value="unlabeled">未标注</option>
          </select>

          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setShowTypeManager(true)}
          >
            管理异常类型
          </Button>
        </div>

        <div className="toolbar-stats">
          <span className="stat-item">
            总计: <strong>{filteredImages.length}</strong>
          </span>
          <span className="stat-item">
            已标注:{' '}
            <strong>
              {filteredImages.filter((img) => getImageStatus(img) !== 'unlabeled').length}
            </strong>
          </span>
        </div>
      </div>

      {/* 图片网格 */}
      <div className="gallery-grid">
        {filteredImages.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            status={getImageStatus(image)}
            boxCount={getBoxCount(image)}
            onClick={() => onImageClick(image)}
          />
        ))}
      </div>

      {/* 空状态 */}
      {filteredImages.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <div className="empty-title">没有找到图片</div>
          <div className="empty-description">
            {searchQuery ? '尝试调整搜索条件' : '该数据集中还没有图片'}
          </div>
        </div>
      )}

      {/* 异常类型管理器 */}
      <ExceptionTypeManager
        visible={showTypeManager}
        onClose={() => setShowTypeManager(false)}
      />
    </div>
  );
}

interface ImageCardProps {
  image: ImageItem;
  status: 'correct' | 'incorrect' | 'unlabeled';
  boxCount: number;
  onClick: () => void;
}

function ImageCard({ image, status, boxCount, onClick }: ImageCardProps) {
  const statusConfig = {
    correct: { icon: <CheckCircleOutlined />, color: 'success', label: '正确' },
    incorrect: { icon: <CloseCircleOutlined />, color: 'error', label: '错误' },
    unlabeled: { icon: <QuestionCircleOutlined />, color: 'default', label: '未标注' },
  };

  const config = statusConfig[status];

  return (
    <div className={`image-card status-${status}`} onClick={onClick}>
      <div className="image-wrapper">
        <img src={image.url} alt={image.filename} loading="lazy" />
      </div>

      <div className="image-info">
        <div className="image-name" title={image.filename}>
          {image.filename}
        </div>
        <div className="image-meta">
          <span className={`status-badge status-${config.color}`}>
            {config.icon}
            {config.label}
          </span>
          {boxCount > 0 && <span className="box-count">📦 {boxCount}</span>}
        </div>
      </div>
    </div>
  );
}
