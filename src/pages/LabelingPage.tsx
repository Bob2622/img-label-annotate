import React, { useEffect, useMemo, useRef, useState } from 'react';
import './labeling.scss';
import { Button, Card, Flex, Space, Typography, Tag, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { appStore, nanoid } from '../store';
import type { Box, Dataset } from '../types';

export default function LabelingPage() {
  const params = useParams();
  const navigate = useNavigate();
  const datasetId = params.datasetId || '';
  const dataset = useMemo<Dataset | undefined>(() => {
    return appStore.getState().datasets.find((d) => d.id === datasetId);
  }, [datasetId]);

  const [index, setIndex] = useState(0);
  const image = dataset?.images[index];
  const [boxes, setBoxes] = useState<Box[]>(image ? appStore.getImageBoxes(image.id) : []);
  const drawingStartRef = useRef<null | { startX: number; startY: number }>(null);
  const tempBoxRef = useRef<Box | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const miniRef = useRef<HTMLDivElement | null>(null);
  const miniDraggingRef = useRef<boolean>(false);
  const [scale, setScale] = useState(1);
  const [viewTick, setViewTick] = useState(0);
  const [containerH, setContainerH] = useState<number>(500);
  const [baseW, setBaseW] = useState<number>(0);
  const [baseH, setBaseH] = useState<number>(0);

  const recomputeLayout = () => {
    if (!containerRef.current) return;
    const top = containerRef.current.getBoundingClientRect().top;
    const h = Math.max(200, window.innerHeight - top);
    setContainerH(h);
    if (imgRef.current) {
      const natW = imgRef.current.naturalWidth || 1;
      const natH = imgRef.current.naturalHeight || 1;
      const cw = containerRef.current.clientWidth || 1;
      const ch = h;
      const fit = (ch / natH) || 1; // 高度 100% 适配为基准
      setBaseW(natW * fit);
      setBaseH(natH * fit);
    }
  };

  useEffect(() => {
    recomputeLayout();
    const onResize = () => recomputeLayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, index]);

  return (
    <Space direction="vertical" size="large" className="label-page">
      <Typography.Title level={3} className="label-title">
        图片标注
      </Typography.Title>
      <Card>
        {!dataset ? (
          <Typography.Text>请选择数据集后再进行标注。</Typography.Text>
        ) : dataset.images.length === 0 ? (
          <Typography.Text>当前数据集暂无图片，请先导入图片。</Typography.Text>
        ) : (
          <Flex gap={16} vertical className="label-flex">
            <Space wrap>
              <Button
                type="primary"
                onClick={() => {
                  if (!image) return;
                  appStore.setImageBoxes(image.id, boxes);
                  message.success('已保存');
                }}
              >
                保存标注
              </Button>
              <Button
                disabled={boxes.length === 0}
                onClick={() => {
                  if (!image || boxes.length === 0) return;
                  const next = boxes.slice(0, -1);
                  setBoxes(next);
                  appStore.setImageBoxes(image.id, next);
                }}
              >
                撤销上一个
              </Button>
              <Button
                danger
                disabled={boxes.length === 0}
                onClick={() => {
                  if (!image || boxes.length === 0) return;
                  setBoxes([]);
                  appStore.setImageBoxes(image.id, []);
                }}
              >
                清空标注
              </Button>
              <Space size={8}>
                <Button
                  onClick={() => {
                    if (!containerRef.current || !contentRef.current) return;
                    const container = containerRef.current;
                    const rect = container.getBoundingClientRect();
                    const centerX = container.scrollLeft + rect.width / 2;
                    const centerY = container.scrollTop + rect.height / 2;
                    const set = (next: number) => {
                      const baseW = contentRef.current!.offsetWidth || 1;
                      const baseH = contentRef.current!.offsetHeight || 1;
                      const prev = scale;
                      const clamped = Math.min(8, Math.max(0.1, next));
                      setScale(clamped);
                      requestAnimationFrame(() => {
                        const ratioX = centerX / (baseW * prev);
                        const ratioY = centerY / (baseH * prev);
                        container.scrollLeft = ratioX * (baseW * clamped) - rect.width / 2;
                        container.scrollTop = ratioY * (baseH * clamped) - rect.height / 2;
                        setViewTick((v) => v + 1);
                      });
                    };
                    set(scale * 0.9);
                  }}
                >
                  缩小
                </Button>
                <Button
                  onClick={() => {
                    if (!containerRef.current || !contentRef.current) return;
                    const container = containerRef.current;
                    const rect = container.getBoundingClientRect();
                    const baseW = contentRef.current.offsetWidth || 1;
                    const baseH = contentRef.current.offsetHeight || 1;
                    setScale(1);
                    requestAnimationFrame(() => {
                      container.scrollLeft = 0;
                      container.scrollTop = 0;
                      setViewTick((v) => v + 1);
                    });
                  }}
                >
                  100%
                </Button>
                <Button
                  onClick={() => {
                    if (!containerRef.current || !contentRef.current) return;
                    const container = containerRef.current;
                    const rect = container.getBoundingClientRect();
                    const baseW = contentRef.current.offsetWidth || 1;
                    const baseH = contentRef.current.offsetHeight || 1;
                    const centerX = container.scrollLeft + rect.width / 2;
                    const centerY = container.scrollTop + rect.height / 2;
                    const prev = scale;
                    const next = 2;
                    setScale(next);
                    requestAnimationFrame(() => {
                      const ratioX = centerX / (baseW * prev);
                      const ratioY = centerY / (baseH * prev);
                      container.scrollLeft = ratioX * (baseW * next) - rect.width / 2;
                      container.scrollTop = ratioY * (baseH * next) - rect.height / 2;
                      setViewTick((v) => v + 1);
                    });
                  }}
                >
                  200%
                </Button>
                <Button
                  onClick={() => {
                    if (!containerRef.current || !contentRef.current) return;
                    const container = containerRef.current;
                    const rect = container.getBoundingClientRect();
                    const centerX = container.scrollLeft + rect.width / 2;
                    const centerY = container.scrollTop + rect.height / 2;
                    const set = (next: number) => {
                      const baseW = contentRef.current!.offsetWidth || 1;
                      const baseH = contentRef.current!.offsetHeight || 1;
                      const prev = scale;
                      const clamped = Math.min(8, Math.max(0.1, next));
                      setScale(clamped);
                      requestAnimationFrame(() => {
                        const ratioX = centerX / (baseW * prev);
                        const ratioY = centerY / (baseH * prev);
                        container.scrollLeft = ratioX * (baseW * clamped) - rect.width / 2;
                        container.scrollTop = ratioY * (baseH * clamped) - rect.height / 2;
                        setViewTick((v) => v + 1);
                      });
                    };
                    set(scale * 1.1);
                  }}
                >
                  放大
                </Button>
                <Button
                  onClick={() => {
                    if (!containerRef.current) return;
                    setScale(1);
                    requestAnimationFrame(() => {
                      containerRef.current!.scrollLeft = 0;
                      containerRef.current!.scrollTop = 0;
                      setViewTick((v) => v + 1);
                    });
                  }}
                >
                  重置视图
                </Button>
              </Space>
              <Button
                onClick={() => {
                  if (!dataset) return;
                  const next = (index + 1) % dataset.images.length;
                  if (image) appStore.setImageBoxes(image.id, boxes);
                  setIndex(next);
                }}
              >
                下一张
              </Button>
              <Button
                onClick={() => {
                  if (!dataset) return;
                  const prev = (index - 1 + dataset.images.length) % dataset.images.length;
                  if (image) appStore.setImageBoxes(image.id, boxes);
                  setIndex(prev);
                }}
              >
                上一张
              </Button>
              <Button
                onClick={() => {
                  if (!image) return;
                  const data = appStore.getState();
                  const exportData = {
                    dataset: dataset?.name,
                    image: image.filename,
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
                }}
              >
                导出当前标注
              </Button>
              <Tag>第 {index + 1} / {dataset.images.length} 张</Tag>
            </Space>
            <div ref={wrapperRef} className="label-wrapper full-height">
              <div
                ref={containerRef}
                className="label-container"
                
              onWheel={(e) => {
                if (!(e.ctrlKey || e.metaKey)) return; // ctrl/cmd + 滚轮缩放
                if (!contentRef.current) return;
                e.preventDefault();
                const factor = e.deltaY < 0 ? 1.1 : 0.9;
                const prev = scale;
                const next = Math.min(8, Math.max(0.1, prev * factor));
                const container = containerRef.current!;
                const rect = container.getBoundingClientRect();
                const baseW = contentRef.current.offsetWidth || 1;
                const baseH = contentRef.current.offsetHeight || 1;
                const pointerX = container.scrollLeft + (e.clientX - rect.left);
                const pointerY = container.scrollTop + (e.clientY - rect.top);
                const ratioX = pointerX / (baseW * prev);
                const ratioY = pointerY / (baseH * prev);
                setScale(next);
                requestAnimationFrame(() => {
                  container.scrollLeft = ratioX * (baseW * next) - (e.clientX - rect.left);
                  container.scrollTop = ratioY * (baseH * next) - (e.clientY - rect.top);
                  setViewTick((v) => v + 1);
                });
              }}
              onScroll={() => {
                if (!containerRef.current) return;
                if ((containerRef.current as any)._rafing) return;
                (containerRef.current as any)._rafing = true;
                requestAnimationFrame(() => {
                  (containerRef.current as any)._rafing = false;
                  setViewTick((v) => v + 1);
                });
              }}
                onMouseDown={(e) => {
                if (!imgRef.current || !contentRef.current) return;
                e.preventDefault();
                const rect = contentRef.current.getBoundingClientRect();
                const baseW = contentRef.current.offsetWidth || 1;
                const baseH = contentRef.current.offsetHeight || 1;
                const natW = imgRef.current.naturalWidth || 1;
                const natH = imgRef.current.naturalHeight || 1;
                const sx = ((e.clientX - rect.left) / scale) / baseW * natW;
                const sy = ((e.clientY - rect.top) / scale) / baseH * natH;
                const startX = sx;
                const startY = sy;
                drawingStartRef.current = { startX, startY };
                tempBoxRef.current = { id: 'temp', x: startX, y: startY, width: 0, height: 0 };

                if (previewRef.current) {
                  previewRef.current.style.display = 'block';
                }
              }}
                onMouseMove={(e) => {
                if (!drawingStartRef.current || !imgRef.current || !contentRef.current) return;
                const rect = contentRef.current.getBoundingClientRect();
                const baseW = contentRef.current.offsetWidth || 1;
                const baseH = contentRef.current.offsetHeight || 1;
                const natW = imgRef.current.naturalWidth || 1;
                const natH = imgRef.current.naturalHeight || 1;
                const currX = ((e.clientX - rect.left) / scale) / baseW * natW;
                const currY = ((e.clientY - rect.top) / scale) / baseH * natH;
                const x = Math.min(drawingStartRef.current.startX, currX);
                const y = Math.min(drawingStartRef.current.startY, currY);
                const width = Math.abs(currX - drawingStartRef.current.startX);
                const height = Math.abs(currY - drawingStartRef.current.startY);
                tempBoxRef.current = { id: 'temp', x, y, width, height };

                if (!rafIdRef.current) {
                  rafIdRef.current = requestAnimationFrame(() => {
                    rafIdRef.current = null;
                    if (!previewRef.current || !imgRef.current || !contentRef.current || !tempBoxRef.current) return;
                    const baseW2 = contentRef.current.offsetWidth || 1;
                    const baseH2 = contentRef.current.offsetHeight || 1;
                    const sx = baseW2 / (imgRef.current.naturalWidth || 1);
                    const sy = baseH2 / (imgRef.current.naturalHeight || 1);
                    const style = previewRef.current.style;
                    style.left = `${tempBoxRef.current.x * sx}px`;
                    style.top = `${tempBoxRef.current.y * sy}px`;
                    style.width = `${tempBoxRef.current.width * sx}px`;
                    style.height = `${tempBoxRef.current.height * sy}px`;
                  });
                }
              }}
                onMouseUp={() => {
                const committed = tempBoxRef.current;
                drawingStartRef.current = null;
                tempBoxRef.current = null;
                if (previewRef.current) {
                  previewRef.current.style.display = 'none';
                }
                if (committed && committed.width >= 2 && committed.height >= 2) {
                  setBoxes((prev) => [...prev, { ...committed, id: nanoid(8) }]);
                }
              }}
                onMouseLeave={() => {
                drawingStartRef.current = null;
                tempBoxRef.current = null;
                if (previewRef.current) previewRef.current.style.display = 'none';
              }}
              >
              <div
                ref={contentRef}
                className="label-content"
                style={{ width: baseW, height: baseH, transform: `scale(${scale})` }}
              >
                {image && (
                  <img
                    ref={imgRef}
                    src={image.url}
                    alt={image.filename}
                    className="label-image"
                    draggable={false}
                    onLoad={() => {
                      if (!image) return;
                      setBoxes(appStore.getImageBoxes(image.id));
                      requestAnimationFrame(() => {
                        recomputeLayout();
                        if (containerRef.current) {
                          containerRef.current.scrollLeft = 0;
                          containerRef.current.scrollTop = 0;
                          setScale(1);
                          setViewTick((v) => v + 1);
                        }
                      });
                    }}
                  />
                )}
                {/* boxes overlay */}
                {image && imgRef.current && (
                  <div className="label-overlay">
                    {/* temp preview rectangle updated via rAF without React state thrash */}
                    <div ref={previewRef} className="label-preview" />
                    {(() => {
                      const baseW = contentRef.current?.offsetWidth || 1;
                      const baseH = contentRef.current?.offsetHeight || 1;
                      const natW = imgRef.current!.naturalWidth || 1;
                      const natH = imgRef.current!.naturalHeight || 1;
                      const sx = baseW / natW;
                      const sy = baseH / natH;
                      return boxes.map((b) => {
                        const style = {
                          left: b.x * sx,
                          top: b.y * sy,
                          width: b.width * sx,
                          height: b.height * sy,
                        } as React.CSSProperties;
                        return (
                          <div key={b.id} className="label-box" style={style} />
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
              </div>

              {/* Minimap overlay in bottom-right inside the container wrapper */}
              {image && (
                <div className="label-minimap-wrapper">
                  {(() => {
                    const mmW = 180;
                    const baseW = contentRef.current?.offsetWidth || 1;
                    const baseH = contentRef.current?.offsetHeight || 1;
                    const mmH = Math.max(40, (baseH / baseW) * mmW);
                    const contentWScaled = baseW * scale;
                    const contentHScaled = baseH * scale;
                    const container = containerRef.current;
                    const scrollLeft = container?.scrollLeft || 0;
                    const scrollTop = container?.scrollTop || 0;
                    const clientW = container?.clientWidth || 1;
                    const clientH = container?.clientHeight || 1;
                    const viewLeft = (scrollLeft / contentWScaled) * mmW;
                    const viewTop = (scrollTop / contentHScaled) * mmH;
                    const viewW = (clientW / contentWScaled) * mmW;
                    const viewH = (clientH / contentHScaled) * mmH;
                    return (
                      <div
                        ref={miniRef}
                        className="label-minimap"
                        style={{ width: mmW, height: mmH, backgroundImage: `url(${image.url})` }}
                        onMouseMove={(e) => {
                          if (!miniDraggingRef.current || !miniRef.current || !containerRef.current || !contentRef.current) return;
                          const rect = miniRef.current.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          const fracX = Math.min(1, Math.max(0, x / rect.width));
                          const fracY = Math.min(1, Math.max(0, y / rect.height));
                          const baseW2 = contentRef.current.offsetWidth || 1;
                          const baseH2 = contentRef.current.offsetHeight || 1;
                          const targetLeft = fracX * (baseW2 * scale) - (containerRef.current.clientWidth / 2);
                          const targetTop = fracY * (baseH2 * scale) - (containerRef.current.clientHeight / 2);
                          containerRef.current.scrollLeft = Math.max(0, Math.min(targetLeft, baseW2 * scale - containerRef.current.clientWidth));
                          containerRef.current.scrollTop = Math.max(0, Math.min(targetTop, baseH2 * scale - containerRef.current.clientHeight));
                          setViewTick((v) => v + 1);
                        }}
                        onMouseLeave={() => {
                          miniDraggingRef.current = false;
                        }}
                        onMouseUp={() => {
                          miniDraggingRef.current = false;
                        }}
                        onMouseDown={(e) => {
                          // start dragging only on viewport rectangle; but allow anywhere for convenience
                          miniDraggingRef.current = true;
                        }}
                      >
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            miniDraggingRef.current = true;
                          }}
                          className="label-minimap-viewport"
                          style={{ left: viewLeft, top: viewTop, width: Math.max(10, viewW), height: Math.max(10, viewH) }}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            
          </Flex>
        )}
      </Card>
    </Space>
  );
}


