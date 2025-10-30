import React from 'react';
import { MenuOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ViewMode } from './Workspace';
import type { Dataset } from '../types';
import './TopBar.scss';

interface TopBarProps {
  viewMode: ViewMode;
  currentDataset?: Dataset | null;
  onToggleSidebar: () => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onDownload?: () => void;
}

export function TopBar({ viewMode, currentDataset, onToggleSidebar, onViewModeChange, onDownload }: TopBarProps) {
  return (
    <header className="top-bar glass-panel">
      <div className="top-bar-left">
        <button className="menu-btn" onClick={onToggleSidebar}>
          <MenuOutlined />
        </button>

        {viewMode === 'gallery' && (
          <div className="search-box">
            <SearchOutlined className="search-icon" />
            <input
              type="text"
              placeholder="搜索图片..."
              className="search-input"
            />
          </div>
        )}
      </div>

      <div className="top-bar-right">
        <div className="view-switcher">
          <button
            className={viewMode === 'gallery' ? 'active' : ''}
            onClick={() => onViewModeChange?.('gallery')}
          >
            画廊
          </button>
          <button
            className={viewMode === 'annotate' ? 'active' : ''}
            onClick={() => onViewModeChange?.('annotate')}
          >
            标注
          </button>
        </div>

        {currentDataset && currentDataset.images.length > 0 && (
          <button className="download-btn" onClick={onDownload} title="下载数据集">
            <DownloadOutlined />
            <span>下载</span>
          </button>
        )}
      </div>
    </header>
  );
}
