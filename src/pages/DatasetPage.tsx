import React, { useMemo, useRef, useState } from 'react';
import { Button, Card, Input, Modal, Space, Table, Tag, Typography, Upload, message } from 'antd';
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
  const [name, setName] = useState('新数据集');
  const [currentId, setCurrentId] = useState<string | null>(null);

  const columns = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '图片数',
      width: 120,
      render: (_: any, record: Dataset) => record.images.length,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: Dataset['status']) => (
        <Tag color={status === '已完成' ? 'green' : status === '进行中' ? 'blue' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 240,
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
              setCurrentId(record.id);
              await appStore.addImages(record.id, files);
              message.success(`已导入 ${files.length} 张图片`);
            }}
          >
            <Button>导入图片</Button>
          </Upload>
          <Button type="link" onClick={() => navigate(`/label/${record.id}`)}>
            标注
          </Button>
        </Space>
      ),
    },
  ];

  const uploadProps: UploadProps = {
    accept: 'image/*',
    multiple: true,
    showUploadList: false,
    beforeUpload: () => false,
  };

  return (
    <Space direction="vertical" size="large" className="dataset-page">
      <Typography.Title level={3} className="dataset-title">
        数据集
      </Typography.Title>
      <Card>
        <Space className="dataset-toolbar">
          <Button type="primary" onClick={() => setCreating(true)}>
            新建数据集
          </Button>
        </Space>
        <Table rowKey="id" dataSource={datasets} columns={columns as any} />
      </Card>

      <Modal
        title="新建数据集"
        open={creating}
        onCancel={() => setCreating(false)}
        onOk={() => {
          const ds = appStore.addDataset(name.trim() || '未命名数据集');
          setCreating(false);
          setName('新数据集');
          message.success('创建成功');
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入名称" />
        </Space>
      </Modal>
    </Space>
  );
}

