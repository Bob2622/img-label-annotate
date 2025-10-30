import React, { useState } from 'react';
import {
  AppstoreOutlined,
  PictureOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Modal, Input, Upload, message, Dropdown } from 'antd';
import type { UploadProps, MenuProps } from 'antd';
import JSZip from 'jszip';
import { appStore } from '../store';
import type { Dataset } from '../types';
import { FormatGuide } from './FormatGuide';
import './Sidebar.scss';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
}

export function Sidebar({ collapsed, onToggle, currentDataset, onSelectDataset }: SidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('新数据集');
  const [uploading, setUploading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // 编辑数据集
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [editDatasetName, setEditDatasetName] = useState('');

  const datasets = appStore.getState().datasets;

  // 创建数据集
  const handleCreate = () => {
    if (!newDatasetName.trim()) {
      message.warning('请输入数据集名称');
      return;
    }
    const dataset = appStore.addDataset(newDatasetName.trim());
    setShowCreateModal(false);
    setNewDatasetName('新数据集');
    onSelectDataset(dataset);
    message.success('数据集创建成功');
  };

  // 打开编辑对话框
  const handleOpenEdit = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setEditDatasetName(dataset.name);
    setShowEditModal(true);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingDataset || !editDatasetName.trim()) {
      message.warning('请输入数据集名称');
      return;
    }
    appStore.updateDataset(editingDataset.id, editDatasetName.trim());
    setShowEditModal(false);
    setEditingDataset(null);
    message.success('数据集名称已更新');
  };

  // 删除数据集
  const handleDelete = (dataset: Dataset) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除数据集"${dataset.name}"吗?删除后无法恢复!`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        appStore.deleteDataset(dataset.id);
        // 如果删除的是当前选中的数据集,切换到第一个
        if (currentDataset?.id === dataset.id) {
          const remaining = appStore.getState().datasets;
          if (remaining.length > 0) {
            onSelectDataset(remaining[0]);
          }
        }
        message.success('数据集已删除');
      },
    });
  };

  // 上传图片
  const uploadProps: UploadProps = {
    accept: 'image/*,.zip',
    multiple: true,
    showUploadList: false,
    beforeUpload: () => false, // 阻止自动上传
    onChange: async (info) => {
      const files = info.fileList.map((f) => f.originFileObj as File);
      if (files.length === 0) return;

      if (!currentDataset) {
        message.warning('请先选择一个数据集');
        return;
      }

      setUploading(true);
      try {
        // 分离普通图片和压缩包
        const imageFiles: File[] = [];
        const zipFiles: File[] = [];

        files.forEach((file) => {
          if (file.name.toLowerCase().endsWith('.zip')) {
            zipFiles.push(file);
          } else if (file.type.startsWith('image/')) {
            imageFiles.push(file);
          }
        });

        // 处理压缩包
        for (const zipFile of zipFiles) {
          const extractedImages = await extractImagesFromZip(zipFile);
          imageFiles.push(...extractedImages);
        }

        if (imageFiles.length === 0) {
          message.warning('未找到有效的图片文件');
          return;
        }

        await appStore.addImages(currentDataset.id, imageFiles);
        message.success(`已添加 ${imageFiles.length} 张图片`);
      } catch (error) {
        console.error('图片上传失败:', error);
        message.error('图片上传失败');
      } finally {
        setUploading(false);
      }
    },
  };

  // 从 ZIP 文件中提取图片
  const extractImagesFromZip = async (zipFile: File): Promise<File[]> => {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(zipFile);
    const imageFiles: File[] = [];

    // 支持的图片格式
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    for (const [path, file] of Object.entries(zipData.files)) {
      if (file.dir) continue; // 跳过目录

      const fileName = path.split('/').pop() || '';
      const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));

      if (imageExtensions.includes(ext)) {
        try {
          const blob = await file.async('blob');
          const imageFile = new File([blob], fileName, { type: `image/${ext.slice(1)}` });
          imageFiles.push(imageFile);
        } catch (error) {
          console.error(`提取图片 ${fileName} 失败:`, error);
        }
      }
    }

    return imageFiles;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* 顶部 Logo 区 */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <PictureOutlined />
          </div>
          {!collapsed && <span className="logo-text">图片标注</span>}
        </div>
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* 导航区 */}
      <nav className="sidebar-nav">
        {/* 暂时注释掉统计和设置功能
        <div className="nav-section">
          <div className="section-title">{!collapsed && '工作区'}</div>
          <NavItem icon={<AppstoreOutlined />} label="工作台" active />
          <NavItem icon={<BarChartOutlined />} label="统计" />
        </div>
        */}

        <div className="nav-section">
          <div className="section-header">
            {!collapsed && <div className="section-title">数据集</div>}
            <button
              className="add-btn"
              onClick={() => setShowCreateModal(true)}
              title="新建数据集"
            >
              <PlusOutlined />
            </button>
          </div>

          {datasets.length === 0 ? (
            !collapsed && (
              <div className="empty-hint">暂无数据集</div>
            )
          ) : (
            datasets.map((dataset) => (
              <DatasetItem
                key={dataset.id}
                dataset={dataset}
                active={currentDataset?.id === dataset.id}
                collapsed={collapsed}
                onClick={() => onSelectDataset(dataset)}
                onEdit={() => handleOpenEdit(dataset)}
                onDelete={() => handleDelete(dataset)}
              />
            ))
          )}
        </div>
      </nav>

      {/* 底部操作区 */}
      <div className="sidebar-footer">
        {currentDataset && (
          <Upload {...uploadProps}>
            <button className="upload-btn" disabled={uploading} title="上传图片">
              <PictureOutlined />
              {!collapsed && <span>{uploading ? '上传中...' : '上传图片'}</span>}
            </button>
          </Upload>
        )}

        <button className="help-btn" onClick={() => setShowGuide(true)} title="使用说明">
          <QuestionCircleOutlined />
          {!collapsed && <span>使用说明</span>}
        </button>

        {/* 暂时注释掉设置按钮
        <button className="settings-btn">
          <SettingOutlined />
          {!collapsed && <span>设置</span>}
        </button>
        */}
      </div>

      {/* 创建数据集弹窗 */}
      <Modal
        title="创建数据集"
        open={showCreateModal}
        onOk={handleCreate}
        onCancel={() => setShowCreateModal(false)}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入数据集名称"
          value={newDatasetName}
          onChange={(e) => setNewDatasetName(e.target.value)}
          onPressEnter={handleCreate}
          autoFocus
        />
      </Modal>

      {/* 编辑数据集弹窗 */}
      <Modal
        title="编辑数据集"
        open={showEditModal}
        onOk={handleSaveEdit}
        onCancel={() => {
          setShowEditModal(false);
          setEditingDataset(null);
        }}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="请输入数据集名称"
          value={editDatasetName}
          onChange={(e) => setEditDatasetName(e.target.value)}
          onPressEnter={handleSaveEdit}
          autoFocus
        />
      </Modal>

      {/* 使用说明弹窗 */}
      <FormatGuide visible={showGuide} onClose={() => setShowGuide(false)} />
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
}

function NavItem({ icon, label, active, badge }: NavItemProps) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`}>
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
      {badge && <span className="badge">{badge}</span>}
    </div>
  );
}

interface DatasetItemProps {
  dataset: Dataset;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DatasetItem({ dataset, active, collapsed, onClick, onEdit, onDelete }: DatasetItemProps) {
  // 下拉菜单配置
  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑名称',
      icon: <EditOutlined />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onEdit();
      },
    },
    {
      key: 'delete',
      label: '删除数据集',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onDelete();
      },
    },
  ];

  return (
    <div
      className={`dataset-item ${active ? 'active' : ''}`}
      onClick={onClick}
      title={collapsed ? dataset.name : ''}
    >
      <span className="icon">
        <FolderOutlined />
      </span>
      {!collapsed && (
        <>
          <span className="label">{dataset.name}</span>
          <span className="count">{dataset.images.length}</span>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button
              className="more-btn"
              onClick={(e) => e.stopPropagation()}
              title="更多操作"
            >
              <MoreOutlined />
            </button>
          </Dropdown>
        </>
      )}
    </div>
  );
}
