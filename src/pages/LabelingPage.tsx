import React, { useEffect, useMemo, useState } from 'react';
import './labeling.scss';
import { Button, Card, Flex, Space, Typography, Tag, message, Modal, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { appStore } from '../store';
import type { Box, Dataset } from '../types';
import { ImageAnnotator } from '../components/ImageAnnotator';

// 预置的异常类型
const PRESET_EXCEPTION_TYPES = ['图文不匹配', '文本重叠', '黑屏', '白屏'];

export default function LabelingPage() {
  const params = useParams();
  const navigate = useNavigate();
  const datasetId = params.datasetId || '';

  const dataset = useMemo<Dataset | undefined>(() => {
    return appStore.getState().datasets.find((d) => d.id === datasetId);
  }, [datasetId]);

  const [index, setIndex] = useState(0);
  const [, forceUpdate] = useState(0);
  const image = dataset?.images[index];

  // 异常类型管理
  const [exceptionTypes, setExceptionTypes] = useState<string[]>(PRESET_EXCEPTION_TYPES);
  const [selectedExceptionType, setSelectedExceptionType] = useState<string>(PRESET_EXCEPTION_TYPES[0]);
  const [showAnnotator, setShowAnnotator] = useState(false);

  // 订阅 store 变化
  useEffect(() => {
    const unsub = appStore.subscribe(() => forceUpdate(v => v + 1));
    return () => unsub();
  }, []);

  // 切换图片时更新状态
  useEffect(() => {
    setShowAnnotator(false);
    // 稍微延迟一下让组件重新挂载
    setTimeout(() => setShowAnnotator(true), 100);
  }, [index, image?.id]);

  const handleSave = (boxes: Box[]) => {
    if (!image) return;
    appStore.setImageBoxes(image.id, boxes);
    message.success('标注已保存');
    setShowAnnotator(false);
    // 稍微延迟再显示,确保状态更新
    setTimeout(() => setShowAnnotator(true), 100);
  };

  const handleNext = () => {
    if (!dataset) return;
    const next = (index + 1) % dataset.images.length;
    setIndex(next);
  };

  const handlePrev = () => {
    if (!dataset) return;
    const prev = (index - 1 + dataset.images.length) % dataset.images.length;
    setIndex(prev);
  };

  const handleExport = () => {
    if (!image) return;
    const exportData = {
      dataset: dataset?.name,
      image: image.filename,
      exceptionType: selectedExceptionType,
      boxes: appStore.getImageBoxes(image.id),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${image.filename}-annotations.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  const handleAddExceptionType = () => {
    Modal.confirm({
      title: '新增异常类型',
      content: (
        <input
          id="new-exception-type"
          type="text"
          placeholder="请输入异常类型名称"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      ),
      onOk: () => {
        const input = document.getElementById('new-exception-type') as HTMLInputElement;
        const newType = input?.value?.trim();
        if (newType && !exceptionTypes.includes(newType)) {
          setExceptionTypes([...exceptionTypes, newType]);
          setSelectedExceptionType(newType);
          message.success(`已添加异常类型: ${newType}`);
        }
      },
    });
  };

  const currentBoxes = image ? appStore.getImageBoxes(image.id) : [];

  return (
    <Space direction="vertical" size="large" className="label-page" style={{ width: '100%' }}>
      <Typography.Title level={3} className="label-title">
        图片标注 - React Image Annotate 集成演示
      </Typography.Title>

      <Card>
        {!dataset ? (
          <Typography.Text>请选择数据集后再进行标注。</Typography.Text>
        ) : dataset.images.length === 0 ? (
          <Typography.Text>当前数据集暂无图片,请先导入图片。</Typography.Text>
        ) : (
          <Flex gap={16} vertical>
            {/* 顶部工具栏 */}
            <Space wrap>
              <Select
                value={selectedExceptionType}
                onChange={setSelectedExceptionType}
                style={{ width: 200 }}
                options={exceptionTypes.map(t => ({ label: t, value: t }))}
                placeholder="选择异常类型"
              />
              <Button onClick={handleAddExceptionType}>
                新增异常类型
              </Button>
              <Button onClick={handlePrev}>
                上一张
              </Button>
              <Button onClick={handleNext}>
                下一张
              </Button>
              <Button onClick={handleExport}>
                导出标注
              </Button>
              <Tag color="blue">
                第 {index + 1} / {dataset.images.length} 张
              </Tag>
              <Tag color="green">
                当前已标注 {currentBoxes.length} 个框
              </Tag>
            </Space>

            {/* 标注编辑器 */}
            <div style={{ height: '70vh', border: '1px solid #d9d9d9', borderRadius: '8px', overflow: 'hidden' }}>
              {image && showAnnotator ? (
                <ImageAnnotator
                  key={`${image.id}-${selectedExceptionType}`}
                  imageUrl={image.url}
                  imageName={image.filename}
                  exceptionType={selectedExceptionType}
                  exceptionTypes={exceptionTypes}
                  initialRegions={currentBoxes}
                  onSave={handleSave}
                  naturalWidth={image.width}
                  naturalHeight={image.height}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f5f5f5'
                }}>
                  <Typography.Text type="secondary">加载中...</Typography.Text>
                </div>
              )}
            </div>

            {/* 使用说明 */}
            <Card size="small" title="使用说明" style={{ background: '#f0f7ff' }}>
              <Space direction="vertical">
                <Typography.Text>
                  • 在图片上拖拽鼠标绘制矩形框进行标注
                </Typography.Text>
                <Typography.Text>
                  • 支持绘制多个框(满足会议需求)
                </Typography.Text>
                <Typography.Text>
                  • 点击右上角 "完成" 按钮保存标注
                </Typography.Text>
                <Typography.Text>
                  • 可以选择不同的异常类型进行分类标注
                </Typography.Text>
                <Typography.Text type="warning">
                  • 当前使用 react-image-annotate 库,坐标自动转换为像素值
                </Typography.Text>
              </Space>
            </Card>
          </Flex>
        )}
      </Card>
    </Space>
  );
}
