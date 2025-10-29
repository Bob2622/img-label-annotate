import React, { useEffect, useRef, useState } from 'react';
import { Button, Space, message } from 'antd';
import { nanoid } from '../store';
import type { Box } from '../types';
import './ImageAnnotator.scss';

export interface ImageAnnotatorProps {
  imageUrl: string;
  imageName: string;
  initialBoxes?: Box[];
  onSave: (boxes: Box[]) => void;
  onCancel?: () => void;
}

type DrawingState =
  | { mode: 'idle' }
  | { mode: 'drawing'; startX: number; startY: number; currentX: number; currentY: number }
  | { mode: 'dragging'; boxIndex: number; offsetX: number; offsetY: number }
  | { mode: 'resizing'; boxIndex: number; handle: string; startX: number; startY: number };

/**
 * 自研图片标注编辑器
 * 支持多框绘制、拖拽、调整大小
 */
export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  imageUrl,
  imageName,
  initialBoxes = [],
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null); // 缓存图片对象
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const [drawingState, setDrawingState] = useState<DrawingState>({ mode: 'idle' });
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  // 加载图片
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const container = containerRef.current!;

      // 缓存图片对象
      imageRef.current = img;

      // 计算缩放以适应容器
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 60; // 减去按钮高度
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const newScale = Math.min(scaleX, scaleY, 1); // 最大不超过原图尺寸

      setScale(newScale);
      setImageSize({ width: img.width, height: img.height });

      canvas.width = img.width * newScale;
      canvas.height = img.height * newScale;

      render(img, newScale);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // 渲染Canvas
  const render = (img?: HTMLImageElement, currentScale?: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const s = currentScale ?? scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 使用缓存的图片或传入的图片
    const imageToUse = img || imageRef.current;

    if (!imageToUse) {
      // 如果图片还没加载完成,暂时不渲染
      return;
    }

    // 绘制图片
    ctx.drawImage(imageToUse, 0, 0, canvas.width, canvas.height);

    // 绘制已有的框
    boxes.forEach((box, index) => {
      const isSelected = index === selectedBoxIndex;
      ctx.strokeStyle = isSelected ? '#1890ff' : '#52c41a';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x * s, box.y * s, box.width * s, box.height * s);

      // 绘制调整句柄
      if (isSelected) {
        const handles = getResizeHandles(box, s);
        ctx.fillStyle = '#1890ff';
        handles.forEach(({ x, y }) => {
          ctx.fillRect(x - 4, y - 4, 8, 8);
        });
      }

      // 绘制标签
      ctx.fillStyle = isSelected ? '#1890ff' : '#52c41a';
      ctx.font = '12px sans-serif';
      ctx.fillText(`框 ${index + 1}`, box.x * s + 4, box.y * s + 16);
    });

    // 绘制正在绘制的框
    if (drawingState.mode === 'drawing') {
      const { startX, startY, currentX, currentY } = drawingState;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);

      ctx.strokeStyle = '#ff4d4f';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  };

  // 获取调整句柄位置
  const getResizeHandles = (box: Box, s: number) => {
    const x = box.x * s;
    const y = box.y * s;
    const w = box.width * s;
    const h = box.height * s;

    return [
      { handle: 'nw', x: x, y: y },
      { handle: 'ne', x: x + w, y: y },
      { handle: 'sw', x: x, y: y + h },
      { handle: 'se', x: x + w, y: y + h },
    ];
  };

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查是否点击了调整句柄
    if (selectedBoxIndex !== null) {
      const box = boxes[selectedBoxIndex];
      const handles = getResizeHandles(box, scale);
      for (const { handle, x: hx, y: hy } of handles) {
        if (Math.abs(x - hx) < 8 && Math.abs(y - hy) < 8) {
          setDrawingState({
            mode: 'resizing',
            boxIndex: selectedBoxIndex,
            handle,
            startX: x,
            startY: y,
          });
          return;
        }
      }
    }

    // 检查是否点击了已有的框
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      const bx = box.x * scale;
      const by = box.y * scale;
      const bw = box.width * scale;
      const bh = box.height * scale;

      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        setSelectedBoxIndex(i);
        setDrawingState({
          mode: 'dragging',
          boxIndex: i,
          offsetX: x - bx,
          offsetY: y - by,
        });
        return;
      }
    }

    // 开始绘制新框
    setSelectedBoxIndex(null);
    setDrawingState({ mode: 'drawing', startX: x, startY: y, currentX: x, currentY: y });
  };

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingState.mode === 'drawing') {
      setDrawingState({ ...drawingState, currentX: x, currentY: y });
      render();
    } else if (drawingState.mode === 'dragging') {
      const newBoxes = [...boxes];
      const box = newBoxes[drawingState.boxIndex];
      box.x = (x - drawingState.offsetX) / scale;
      box.y = (y - drawingState.offsetY) / scale;
      setBoxes(newBoxes);
      render();
    } else if (drawingState.mode === 'resizing') {
      const newBoxes = [...boxes];
      const box = newBoxes[drawingState.boxIndex];
      const dx = (x - drawingState.startX) / scale;
      const dy = (y - drawingState.startY) / scale;

      if (drawingState.handle.includes('n')) {
        box.y += dy;
        box.height -= dy;
      }
      if (drawingState.handle.includes('s')) {
        box.height += dy;
      }
      if (drawingState.handle.includes('w')) {
        box.x += dx;
        box.width -= dx;
      }
      if (drawingState.handle.includes('e')) {
        box.width += dx;
      }

      setBoxes(newBoxes);
      setDrawingState({ ...drawingState, startX: x, startY: y });
      render();
    }
  };

  // 鼠标松开
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingState.mode === 'drawing') {
      const { startX, startY, currentX, currentY } = drawingState;
      const x = Math.min(startX, currentX) / scale;
      const y = Math.min(startY, currentY) / scale;
      const w = Math.abs(currentX - startX) / scale;
      const h = Math.abs(currentY - startY) / scale;

      // 只有框足够大才添加
      if (w > 10 && h > 10) {
        const newBox: Box = {
          id: nanoid(8),
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(w),
          height: Math.round(h),
        };
        setBoxes([...boxes, newBox]);
        setSelectedBoxIndex(boxes.length);
      }
    }

    setDrawingState({ mode: 'idle' });
    render();
  };

  // 重置
  const handleReset = () => {
    setBoxes([]);
    setSelectedBoxIndex(null);
    render();
    message.success('已清空所有标注框');
  };

  // 删除选中的框
  const handleDeleteSelected = () => {
    if (selectedBoxIndex !== null) {
      const newBoxes = boxes.filter((_, i) => i !== selectedBoxIndex);
      setBoxes(newBoxes);
      setSelectedBoxIndex(null);
      render();
      message.success('已删除选中的框');
    }
  };

  // 确认保存
  const handleConfirm = () => {
    onSave(boxes);
    message.success('标注已保存');
  };

  // 重新渲染
  useEffect(() => {
    render();
  }, [boxes, selectedBoxIndex, drawingState, scale]);

  return (
    <div ref={containerRef} className="image-annotator" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            cursor: 'crosshair',
            border: '1px solid #d9d9d9',
            display: 'block',
            imageRendering: 'crisp-edges'
          }}
        />
      </div>
      <Space style={{ marginTop: 16, justifyContent: 'center', width: '100%' }}>
        <Button onClick={handleReset}>清空所有框</Button>
        <Button onClick={handleDeleteSelected} disabled={selectedBoxIndex === null}>
          删除选中框
        </Button>
        <Button type="primary" onClick={handleConfirm}>
          确认保存
        </Button>
        {onCancel && <Button onClick={onCancel}>取消</Button>}
      </Space>
      <div style={{ marginTop: 8, textAlign: 'center', color: '#666', fontSize: 12 }}>
        当前已绘制 {boxes.length} 个框 | 拖拽鼠标绘制新框 | 点击框选中后可拖拽或调整大小
      </div>
    </div>
  );
};
