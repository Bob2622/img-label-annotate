import React, { useState, useEffect } from 'react';
import { Modal, Progress, message } from 'antd';
import { Sidebar } from './Sidebar';
import { GalleryView } from './GalleryView';
import { AnnotateView } from './AnnotateView';
import { TopBar } from './TopBar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { ImageItem, Dataset } from '../types';
import { appStore } from '../store';

export type ViewMode = 'gallery' | 'annotate';

export function Workspace() {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [, forceUpdate] = useState(0);

  // 下载进度状态
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');

  // 订阅 store 更新
  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      forceUpdate((v) => v + 1);
      // 当 store 更新时,如果还没有选中数据集,自动选中第一个
      const datasets = appStore.getState().datasets;
      if (datasets.length > 0 && !currentDataset) {
        setCurrentDataset(datasets[0]);
      }
    });
    return unsubscribe;
  }, [currentDataset]);

  // 初始化加载第一个数据集
  useEffect(() => {
    const datasets = appStore.getState().datasets;
    if (datasets.length > 0) {
      setCurrentDataset(datasets[0]);
    }
  }, []);

  // 切换到标注视图
  const handleEnterAnnotate = (image: ImageItem) => {
    setCurrentImage(image);
    setViewMode('annotate');
  };

  // 退出标注视图
  const handleExitAnnotate = () => {
    setViewMode('gallery');
    setCurrentImage(null);
  };

  // 切换到下一张/上一张
  const handleNavigate = (direction: 'next' | 'previous') => {
    if (!currentDataset || !currentImage) return;

    const images = currentDataset.images;
    const currentIndex = images.findIndex((img) => img.id === currentImage.id);

    if (direction === 'next' && currentIndex < images.length - 1) {
      setCurrentImage(images[currentIndex + 1]);
    } else if (direction === 'previous' && currentIndex > 0) {
      setCurrentImage(images[currentIndex - 1]);
    }
  };

  // 全局快捷键
  useKeyboardShortcuts({
    Escape: () => {
      if (viewMode === 'annotate') {
        handleExitAnnotate();
      }
    },
    g: () => {
      if (viewMode !== 'gallery') {
        setViewMode('gallery');
      }
    },
    a: () => {
      if (viewMode !== 'annotate' && currentImage) {
        setViewMode('annotate');
      }
    },
  });

  // 下载数据集
  const handleDownload = async () => {
    if (!currentDataset) {
      message.warning('请先选择一个数据集');
      return;
    }

    if (currentDataset.images.length === 0) {
      message.warning('该数据集中没有图片');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setDownloadMessage('准备下载...');

    try {
      await appStore.downloadDataset(currentDataset.id, (progress, msg) => {
        setDownloadProgress(progress);
        setDownloadMessage(msg);
      });
      message.success('下载完成');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败,请重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="workspace">
      {/* 侧边栏 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentDataset={currentDataset}
        onSelectDataset={setCurrentDataset}
      />

      {/* 主工作区 */}
      <div className="workspace-main">
        {/* 顶部工具栏 */}
        <TopBar
          viewMode={viewMode}
          currentDataset={currentDataset}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onDownload={handleDownload}
          onViewModeChange={(mode) => {
            if (mode === 'gallery') {
              handleExitAnnotate();
            } else if (mode === 'annotate') {
              // 切换到标注视图
              if (!currentImage && currentDataset && currentDataset.images.length > 0) {
                // 如果没有选中图片,自动选择第一张
                setCurrentImage(currentDataset.images[0]);
                setViewMode('annotate');
              } else if (currentImage) {
                // 如果已经有选中的图片,直接切换
                setViewMode('annotate');
              }
            }
          }}
        />

        {/* 内容区域 */}
        <div className="workspace-content">
          {viewMode === 'gallery' && currentDataset && (
            <GalleryView
              dataset={currentDataset}
              onImageClick={handleEnterAnnotate}
            />
          )}

          {viewMode === 'annotate' && currentImage && currentDataset && (
            <AnnotateView
              image={currentImage}
              dataset={currentDataset}
              onClose={handleExitAnnotate}
              onNavigate={handleNavigate}
            />
          )}
        </div>
      </div>

      {/* 下载进度弹窗 */}
      <Modal
        title="正在下载数据集"
        open={downloading}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <div style={{ padding: '20px 0' }}>
          <Progress percent={Math.round(downloadProgress)} status="active" />
          <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
            {downloadMessage}
          </div>
        </div>
      </Modal>
    </div>
  );
}
