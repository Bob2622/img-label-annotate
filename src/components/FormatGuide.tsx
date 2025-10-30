import React from 'react';
import { Modal, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import './FormatGuide.scss';

interface FormatGuideProps {
  visible: boolean;
  onClose: () => void;
}

export function FormatGuide({ visible, onClose }: FormatGuideProps) {
  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div className="guide-content">
          <h3>图片标注平台使用说明</h3>
          <p>本平台支持图片多框标注、异常类型管理和数据导出功能。</p>

          <h4>核心功能</h4>
          <ul>
            <li><strong>数据集管理</strong>: 创建、编辑、删除数据集</li>
            <li><strong>图片上传</strong>: 支持单张/批量上传图片,支持 ZIP 压缩包</li>
            <li><strong>多框标注</strong>: 在图片上绘制多个标注框</li>
            <li><strong>异常类型</strong>: 自定义异常类型(如"图文不匹配"、"文本重叠"等)</li>
            <li><strong>状态标记</strong>: 为每张图片的每个异常类型标记"正确"/"错误"状态</li>
            <li><strong>数据导出</strong>: 导出标注数据和图片为 ZIP 包</li>
          </ul>

          <h4>快捷键</h4>
          <ul>
            <li><kbd>G</kbd> - 切换到画廊视图</li>
            <li><kbd>A</kbd> - 切换到标注视图</li>
            <li><kbd>S</kbd> - 保存并标记为"正确"</li>
            <li><kbd>D</kbd> - 保存并标记为"错误"</li>
            <li><kbd>F</kbd> - 跳过当前图片</li>
            <li><kbd>←</kbd> / <kbd>→</kbd> - 上一张/下一张图片</li>
            <li><kbd>ESC</kbd> - 退出标注视图</li>
            <li><kbd>Enter</kbd> - 保存并继续</li>
          </ul>
        </div>
      ),
    },
    {
      key: 'upload',
      label: '上传格式',
      children: (
        <div className="guide-content">
          <h3>图片上传</h3>

          <h4>支持格式</h4>
          <ul>
            <li>单张图片: JPG, JPEG, PNG, GIF, BMP, WEBP</li>
            <li>批量上传: 可同时选择多张图片</li>
            <li>压缩包: 支持 .zip 格式,自动解压提取图片</li>
          </ul>

          <h4>ZIP 压缩包格式</h4>
          <pre className="code-block">
{`dataset.zip
├── image1.jpg
├── image2.png
├── subfolder/
│   ├── image3.jpg
│   └── image4.png
└── ...`}
          </pre>
          <p className="note">
            📝 注意: ZIP 包中的图片可以在任意深度的文件夹中,系统会自动递归提取所有图片文件。
          </p>

          <h4>上传步骤</h4>
          <ol>
            <li>在侧边栏选择一个数据集(或新建数据集)</li>
            <li>点击侧边栏底部的"上传图片"按钮</li>
            <li>选择图片文件或 ZIP 压缩包</li>
            <li>等待上传完成</li>
          </ol>
        </div>
      ),
    },
    {
      key: 'annotation',
      label: '标注说明',
      children: (
        <div className="guide-content">
          <h3>标注流程</h3>

          <h4>数据模型</h4>
          <p>本平台采用<strong>笛卡尔积数据模型</strong>:</p>
          <pre className="code-block">
{`总数据量 = 图片数量 × 异常类型数量 × 标注状态(3种)

例如:
- 100 张图片
- 2 种异常类型("图文不匹配", "文本重叠")
- 3 种状态("未标注", "正确", "错误")
= 100 × 2 × 3 = 600 条标注记录`}
          </pre>

          <h4>标注步骤</h4>
          <ol>
            <li><strong>选择异常类型</strong>: 在底部工具栏选择要标注的异常类型</li>
            <li><strong>绘制标注框</strong>: 在图片上拖拽绘制矩形框</li>
            <li><strong>填写信息</strong>:
              <ul>
                <li>类别: 用于回归任务的分类(可选)</li>
                <li>标签: 标注框的标签描述(可选)</li>
                <li>备注: 标注理由或思维链(可选)</li>
              </ul>
            </li>
            <li><strong>保存状态</strong>: 点击"正确"或"错误"按钮保存</li>
            <li><strong>切换异常类型</strong>: 可为同一张图片标注多个异常类型</li>
          </ol>

          <h4>标注框操作</h4>
          <ul>
            <li><strong>新建</strong>: 在空白处拖拽鼠标</li>
            <li><strong>移动</strong>: 拖动标注框</li>
            <li><strong>调整大小</strong>: 拖动标注框边缘或角落</li>
            <li><strong>删除</strong>: 选中标注框后按 Delete 键</li>
          </ul>
        </div>
      ),
    },
    {
      key: 'export',
      label: '导出格式',
      children: (
        <div className="guide-content">
          <h3>数据导出</h3>

          <h4>导出方式</h4>
          <p>点击顶部工具栏的"下载"按钮,系统会将数据集打包为 ZIP 文件。</p>

          <h4>导出内容</h4>
          <pre className="code-block">
{`dataset_name_timestamp.zip
├── annotations.json    # 标注数据
└── images/            # 所有图片
    ├── image1.jpg
    ├── image2.png
    └── ...`}
          </pre>

          <h4>annotations.json 格式</h4>
          <pre className="code-block">
{`{
  "dataset": "数据集名称",
  "exportTime": "2025-01-30T10:00:00.000Z",
  "images": [
    {
      "id": "图片ID",
      "filename": "image1.jpg",
      "width": 1920,
      "height": 1080,
      "annotations": [
        {
          "exceptionType": "图文不匹配",
          "status": "错误",
          "boxes": [
            {
              "x": 100,
              "y": 200,
              "width": 300,
              "height": 150
            }
          ],
          "category": "类别A",
          "label": "标签描述",
          "remark": "标注理由说明"
        },
        {
          "exceptionType": "文本重叠",
          "status": "正确",
          "boxes": [],
          "category": "",
          "label": "",
          "remark": ""
        }
      ]
    }
  ]
}`}
          </pre>

          <h4>字段说明</h4>
          <table className="field-table">
            <thead>
              <tr>
                <th>字段</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>exceptionType</td>
                <td>string</td>
                <td>异常类型名称</td>
              </tr>
              <tr>
                <td>status</td>
                <td>string</td>
                <td>标注状态: "未标注" / "正确" / "错误"</td>
              </tr>
              <tr>
                <td>boxes</td>
                <td>array</td>
                <td>标注框数组,每个框包含 x, y, width, height</td>
              </tr>
              <tr>
                <td>category</td>
                <td>string</td>
                <td>类别(可选)</td>
              </tr>
              <tr>
                <td>label</td>
                <td>string</td>
                <td>标签(可选)</td>
              </tr>
              <tr>
                <td>remark</td>
                <td>string</td>
                <td>备注/思维链(可选)</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="使用说明"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="format-guide-modal"
    >
      <Tabs items={items} />
    </Modal>
  );
}
