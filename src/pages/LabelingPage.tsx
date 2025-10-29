import React, { useEffect, useMemo, useRef, useState } from 'react';
import './labeling.scss';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { appStore } from '../store';
import type { AnnotationStatus, Dataset, ExceptionAnnotation, ImageItem } from '../types';
import { ImageAnnotator } from '../components/ImageAnnotator';

export default function LabelingPage() {
  const params = useParams();
  const navigate = useNavigate();
  const datasetId = params.datasetId || '';
  const [, force] = useState(0);
  const unsubRef = useRef<() => void>();

  useEffect(() => {
    unsubRef.current = appStore.subscribe(() => force((v) => v + 1));
    return () => unsubRef.current?.();
  }, []);

  // 获取数据集
  const dataset = useMemo<Dataset | undefined>(() => {
    return appStore.getState().datasets.find((d) => d.id === datasetId);
  }, [datasetId, force]);

  // 获取异常类型列表
  const exceptionTypes = useMemo(() => appStore.getExceptionTypes(), [force]);

  // 筛选条件
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasetId);
  const [selectedExceptionType, setSelectedExceptionType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchImageName, setSearchImageName] = useState<string>('');

  // 标注编辑器状态
  const [annotatingImage, setAnnotatingImage] = useState<ImageItem | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<ExceptionAnnotation | null>(null);

  // 新增异常类型
  const [addingException, setAddingException] = useState(false);
  const [newExceptionName, setNewExceptionName] = useState('');

  // 获取数据集列表
  const datasets = useMemo(() => appStore.getState().datasets, [force]);

  // 切换数据集时更新状态
  useEffect(() => {
    if (selectedDatasetId) {
      navigate(`/label/${selectedDatasetId}`);
    }
  }, [selectedDatasetId]);

  // 初始化异常类型选择
  useEffect(() => {
    if (exceptionTypes.length > 0 && !selectedExceptionType) {
      setSelectedExceptionType(exceptionTypes[0].name);
    }
  }, [exceptionTypes]);

  // 筛选图片列表
  const filteredImages = useMemo(() => {
    if (!dataset) return [];

    return dataset.images.filter((img) => {
      // 按图片名称筛选
      if (searchImageName && !img.filename.includes(searchImageName)) {
        return false;
      }

      // 按异常类型和状态筛选
      if (selectedExceptionType) {
        const annotation = appStore.getImageExceptionAnnotation(img.id, selectedExceptionType);

        if (selectedStatus === 'labeled' && (!annotation || annotation.status === '未标注')) {
          return false;
        }
        if (selectedStatus === 'unlabeled' && annotation && annotation.status !== '未标注') {
          return false;
        }
      }

      return true;
    });
  }, [dataset, selectedExceptionType, selectedStatus, searchImageName, force]);

  // 处理新增异常类型
  const handleAddExceptionType = () => {
    const trimmed = newExceptionName.trim();
    if (!trimmed) {
      message.error('请输入异常类型名称');
      return;
    }

    if (exceptionTypes.some((t) => t.name === trimmed)) {
      message.error('该异常类型已存在');
      return;
    }

    appStore.addExceptionType(trimmed);
    setSelectedExceptionType(trimmed);
    setAddingException(false);
    setNewExceptionName('');
    message.success('异常类型添加成功');
  };

  // 打开标注编辑器
  const handleAnnotate = (image: ImageItem) => {
    if (!selectedExceptionType) {
      message.warning('请先选择异常类型');
      return;
    }

    setAnnotatingImage(image);

    // 获取该图片在当前异常类型下的标注
    const annotation = appStore.getImageExceptionAnnotation(image.id, selectedExceptionType);

    if (annotation) {
      setCurrentAnnotation(annotation);
    } else {
      // 创建新的标注记录
      setCurrentAnnotation({
        exceptionType: selectedExceptionType,
        status: '未标注',
        boxes: [],
        category: '',
        label: '',
        remark: '',
      });
    }
  };

  // 保存标注
  const handleSaveAnnotation = (
    boxes: any[],
    category: string,
    label: string,
    remark: string,
    status: AnnotationStatus
  ) => {
    if (!annotatingImage || !currentAnnotation) return;

    const annotation: ExceptionAnnotation = {
      exceptionType: selectedExceptionType,
      status,
      boxes,
      category: category.trim(),
      label: label.trim(),
      remark: remark.trim(),
    };

    appStore.saveImageExceptionAnnotation(annotatingImage.id, dataset!.id, annotation);
    setAnnotatingImage(null);
    setCurrentAnnotation(null);
    message.success('标注已保存');
  };

  // 表格列定义
  const columns = [
    {
      title: '原始图片',
      dataIndex: 'url',
      key: 'url',
      width: 120,
      render: (url: string, record: ImageItem) => (
        <img
          src={url}
          alt={record.filename}
          style={{ width: 80, height: 80, objectFit: 'contain', border: '1px solid #d9d9d9' }}
        />
      ),
    },
    {
      title: '图片名称',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: '标注状态',
      key: 'status',
      width: 120,
      render: (_: any, record: ImageItem) => {
        if (!selectedExceptionType) return <Tag>-</Tag>;

        const annotation = appStore.getImageExceptionAnnotation(record.id, selectedExceptionType);
        if (!annotation || annotation.status === '未标注') {
          return <Tag>未标注</Tag>;
        }
        if (annotation.status === '正确') {
          return <Tag color="green">正确</Tag>;
        }
        return <Tag color="red">错误</Tag>;
      },
    },
    {
      title: '标注框数量',
      key: 'boxCount',
      width: 120,
      render: (_: any, record: ImageItem) => {
        if (!selectedExceptionType) return '-';
        const annotation = appStore.getImageExceptionAnnotation(record.id, selectedExceptionType);
        return annotation?.boxes.length || 0;
      },
    },
    {
      title: '类别',
      key: 'category',
      width: 120,
      render: (_: any, record: ImageItem) => {
        if (!selectedExceptionType) return '-';
        const annotation = appStore.getImageExceptionAnnotation(record.id, selectedExceptionType);
        return annotation?.category || '-';
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: ImageItem) => (
        <Button type="link" size="small" onClick={() => handleAnnotate(record)}>
          标注
        </Button>
      ),
    },
  ];

  if (!dataset) {
    return (
      <Card>
        <Typography.Text>数据集不存在,请返回数据集页面。</Typography.Text>
        <Button type="link" onClick={() => navigate('/datasets')}>
          返回数据集
        </Button>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }} className="label-page">
      <Typography.Title level={3}>图片标注 - {dataset.name}</Typography.Title>

      <Row gutter={16}>
        {/* 左侧筛选区 */}
        <Col span={6}>
          <Card title="筛选条件">
            <Form layout="vertical">
              <Form.Item label="数据集">
                <Select
                  value={selectedDatasetId}
                  onChange={setSelectedDatasetId}
                  options={datasets.map((d) => ({ label: d.name, value: d.id }))}
                />
              </Form.Item>

              <Form.Item label="异常类型">
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    style={{ flex: 1 }}
                    value={selectedExceptionType}
                    onChange={setSelectedExceptionType}
                    options={exceptionTypes.map((t) => ({ label: t.name, value: t.name }))}
                    placeholder="选择异常类型"
                  />
                  <Button icon={<PlusOutlined />} onClick={() => setAddingException(true)} />
                </Space.Compact>
              </Form.Item>

              <Form.Item label="标注状态">
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '已标注', value: 'labeled' },
                    { label: '未标注', value: 'unlabeled' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="图片名称">
                <Input
                  placeholder="输入图片名称"
                  value={searchImageName}
                  onChange={(e) => setSearchImageName(e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧列表区 */}
        <Col span={18}>
          <Card
            title="图片列表"
            extra={
              <Space>
                <Tag>
                  共 {filteredImages.length} 张图片
                </Tag>
                <Button onClick={() => navigate('/datasets')}>返回数据集</Button>
              </Space>
            }
          >
            <Table
              rowKey="id"
              dataSource={filteredImages}
              columns={columns}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 新增异常类型弹窗 */}
      <Modal
        title="新增异常类型"
        open={addingException}
        onCancel={() => {
          setAddingException(false);
          setNewExceptionName('');
        }}
        onOk={handleAddExceptionType}
      >
        <Input
          placeholder="请输入异常类型名称(如:黑屏、白屏)"
          value={newExceptionName}
          onChange={(e) => setNewExceptionName(e.target.value)}
          onPressEnter={handleAddExceptionType}
        />
      </Modal>

      {/* 标注编辑器弹窗 */}
      <Modal
        title={`标注图片: ${annotatingImage?.filename} - ${selectedExceptionType}`}
        open={!!annotatingImage}
        width="90%"
        style={{ top: 20 }}
        footer={null}
        onCancel={() => {
          setAnnotatingImage(null);
          setCurrentAnnotation(null);
        }}
      >
        {annotatingImage && currentAnnotation && (
          <AnnotationEditor
            image={annotatingImage}
            annotation={currentAnnotation}
            onSave={handleSaveAnnotation}
            onCancel={() => {
              setAnnotatingImage(null);
              setCurrentAnnotation(null);
            }}
          />
        )}
      </Modal>
    </Space>
  );
}

// 标注编辑器组件
interface AnnotationEditorProps {
  image: ImageItem;
  annotation: ExceptionAnnotation;
  onSave: (
    boxes: any[],
    category: string,
    label: string,
    remark: string,
    status: AnnotationStatus
  ) => void;
  onCancel: () => void;
}

const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  image,
  annotation,
  onSave,
  onCancel,
}) => {
  const [boxes, setBoxes] = useState(annotation.boxes);
  const [category, setCategory] = useState(annotation.category || '');
  const [label, setLabel] = useState(annotation.label || '');
  const [remark, setRemark] = useState(annotation.remark || '');

  const handleSaveBoxes = (newBoxes: any[]) => {
    setBoxes(newBoxes);
  };

  const handleConfirm = (status: AnnotationStatus) => {
    if (!label.trim() && boxes.length > 0) {
      message.warning('请填写标签');
      return;
    }

    onSave(boxes, category, label, remark, status);
  };

  return (
    <div style={{ height: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Row gutter={16} style={{ flex: 1, minHeight: 0 }}>
        <Col span={18} style={{ height: '100%' }}>
          <ImageAnnotator
            imageUrl={image.url}
            imageName={image.filename}
            initialBoxes={boxes}
            onSave={handleSaveBoxes}
          />
        </Col>
        <Col span={6} style={{ height: '100%', overflow: 'auto' }}>
          <Card title="标注信息" size="small">
            <Form layout="vertical">
              <Form.Item label="类别(可选)" help="用于回归任务,如 true/false">
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="如: true/false"
                />
              </Form.Item>
              <Form.Item label="标签(必填)" help="标注结果的文本说明">
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="如: 文字超出边界"
                />
              </Form.Item>
              <Form.Item label="备注(可选)" help="标注理由,用于训练思维链">
                <Input.TextArea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="如: 右侧文字被截断"
                  rows={4}
                />
              </Form.Item>
              <Form.Item>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    onClick={() => handleConfirm('正确')}
                    style={{ background: '#52c41a' }}
                  >
                    标记为正确(有异常)
                  </Button>
                  <Button block onClick={() => handleConfirm('错误')} danger>
                    标记为错误(无异常)
                  </Button>
                  <Button block onClick={onCancel}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
