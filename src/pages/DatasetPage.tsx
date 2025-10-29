import React, { useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { appStore } from '../store';
import type { Dataset } from '../types';
import './dataset.scss';

export default function DatasetPage() {
  const navigate = useNavigate();
  const [, force] = useState(0);
  const unsubRef = useRef<() => void>();

  React.useEffect(() => {
    unsubRef.current = appStore.subscribe(() => force((v) => v + 1));
    return () => unsubRef.current?.();
  }, []);

  const datasets = useMemo(() => appStore.getState().datasets, [, force]);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Dataset | null>(null);
  const [name, setName] = useState('新数据集');
  const [searchText, setSearchText] = useState('');

  // 查询过滤
  const filteredDatasets = useMemo(() => {
    if (!searchText.trim()) return datasets;
    return datasets.filter((ds) => ds.name.includes(searchText.trim()));
  }, [datasets, searchText]);

  // 修改数据集
  const handleEdit = (record: Dataset) => {
    setEditing(record);
    setName(record.name);
  };

  // 删除数据集
  const handleDelete = (datasetId: string) => {
    appStore.deleteDataset(datasetId);
    message.success('删除成功');
  };

  // 触发下载(导出标注)
  const handleDownload = (datasetId: string) => {
    appStore.exportAnnotations(datasetId);
    message.success('标注数据导出成功');
  };

  const columns = [
    { title: '数据集名称', dataIndex: 'name', key: 'name' },
    {
      title: '图片数量',
      key: 'imageCount',
      width: 120,
      render: (_: any, record: Dataset) => record.images.length,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Dataset['status']) => (
        <Tag color={status === '已完成' ? 'green' : status === '进行中' ? 'blue' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 380,
      render: (_: any, record: Dataset) => (
        <Space>
          <Upload
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={() => false}
            onChange={async (info) => {
              const files = info.fileList.map((f) => f.originFileObj!).filter(Boolean);
              if (files.length === 0) return;
              await appStore.addImages(record.id, files);
              message.success(`已导入 ${files.length} 张图片`);
            }}
          >
            <Button size="small">新增数据</Button>
          </Upload>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            修改
          </Button>
          <Popconfirm
            title="确认删除?"
            description="删除后将清空该数据集下的所有图片和标注数据"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id)}
            disabled={record.images.length === 0}
          >
            下载
          </Button>
          <Button size="small" type="link" onClick={() => navigate(`/label/${record.id}`)}>
            进入标注
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" className="dataset-page" style={{ width: '100%' }}>
      <Typography.Title level={3} className="dataset-title">
        数据集管理
      </Typography.Title>
      <Card>
        <Space className="dataset-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="按数据集名称查询"
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
          />
          <Button onClick={() => setSearchText('')}>重置</Button>
          <Button type="primary" onClick={() => setCreating(true)}>
            新建数据集
          </Button>
        </Space>
        <Table rowKey="id" dataSource={filteredDatasets} columns={columns as any} />
      </Card>

      {/* 新建数据集 */}
      <Modal
        title="新建数据集"
        open={creating}
        onCancel={() => {
          setCreating(false);
          setName('新数据集');
        }}
        onOk={() => {
          const finalName = name.trim() || '未命名数据集';
          appStore.addDataset(finalName);
          setCreating(false);
          setName('新数据集');
          message.success('创建成功');
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <label>数据集名称</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入名称" />
        </Space>
      </Modal>

      {/* 修改数据集 */}
      <Modal
        title="修改数据集名称"
        open={!!editing}
        onCancel={() => {
          setEditing(null);
          setName('新数据集');
        }}
        onOk={() => {
          if (!editing) return;
          const finalName = name.trim() || '未命名数据集';
          appStore.updateDataset(editing.id, finalName);
          setEditing(null);
          setName('新数据集');
          message.success('修改成功');
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <label>数据集名称</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入名称" />
        </Space>
      </Modal>
    </Space>
  );
}

