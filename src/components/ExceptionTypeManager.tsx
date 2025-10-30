import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Button, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined } from '@ant-design/icons';
import { appStore } from '../store';
import type { ExceptionType } from '../types';
import './ExceptionTypeManager.scss';

interface ExceptionTypeManagerProps {
  visible: boolean;
  onClose: () => void;
}

export function ExceptionTypeManager({ visible, onClose }: ExceptionTypeManagerProps) {
  const [exceptionTypes, setExceptionTypes] = useState<ExceptionType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingType, setEditingType] = useState<ExceptionType | null>(null);
  const [typeName, setTypeName] = useState('');

  // 加载异常类型列表
  const loadExceptionTypes = () => {
    setExceptionTypes(appStore.getExceptionTypes());
  };

  useEffect(() => {
    if (visible) {
      loadExceptionTypes();
    }
  }, [visible]);

  // 订阅 store 更新
  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      loadExceptionTypes();
    });
    return unsubscribe;
  }, []);

  // 添加异常类型
  const handleAdd = () => {
    if (!typeName.trim()) {
      message.warning('请输入异常类型名称');
      return;
    }

    // 检查重复
    if (exceptionTypes.some((t) => t.name === typeName.trim())) {
      message.warning('该异常类型已存在');
      return;
    }

    appStore.addExceptionType(typeName.trim());
    setShowAddModal(false);
    setTypeName('');
    message.success('异常类型已添加');
  };

  // 编辑异常类型
  const handleEdit = () => {
    if (!editingType || !typeName.trim()) {
      message.warning('请输入异常类型名称');
      return;
    }

    if (editingType.preset) {
      message.warning('预置类型不允许修改');
      return;
    }

    // 检查重复
    if (
      exceptionTypes.some(
        (t) => t.id !== editingType.id && t.name === typeName.trim()
      )
    ) {
      message.warning('该异常类型已存在');
      return;
    }

    appStore.updateExceptionType(editingType.id, typeName.trim());
    setShowEditModal(false);
    setEditingType(null);
    setTypeName('');
    message.success('异常类型已更新');
  };

  // 删除异常类型
  const handleDelete = (type: ExceptionType) => {
    if (type.preset) {
      message.warning('预置类型不允许删除');
      return;
    }

    appStore.deleteExceptionType(type.id);
    message.success('异常类型已删除');
  };

  // 打开编辑对话框
  const openEditModal = (type: ExceptionType) => {
    if (type.preset) {
      message.warning('预置类型不允许修改');
      return;
    }
    setEditingType(type);
    setTypeName(type.name);
    setShowEditModal(true);
  };

  return (
    <>
      <Modal
        title="管理异常类型"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        <div className="exception-type-manager">
          <div className="manager-header">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddModal(true)}
            >
              添加异常类型
            </Button>
          </div>

          <List
            className="type-list"
            dataSource={exceptionTypes}
            renderItem={(type) => (
              <List.Item
                className={type.preset ? 'preset-item' : ''}
                actions={
                  type.preset
                    ? [
                        <span key="preset" className="preset-badge">
                          预置
                        </span>,
                      ]
                    : [
                        <Button
                          key="edit"
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(type)}
                        />,
                        <Popconfirm
                          key="delete"
                          title="确认删除"
                          description="删除后,所有使用该类型的标注数据将被清除,确定要继续吗?"
                          onConfirm={() => handleDelete(type)}
                          okText="确认删除"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>,
                      ]
                }
              >
                <List.Item.Meta
                  avatar={<TagOutlined />}
                  title={type.name}
                  description={type.preset ? '系统预置类型' : '自定义类型'}
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>

      {/* 添加异常类型弹窗 */}
      <Modal
        title="添加异常类型"
        open={showAddModal}
        onOk={handleAdd}
        onCancel={() => {
          setShowAddModal(false);
          setTypeName('');
        }}
        okText="添加"
        cancelText="取消"
      >
        <Input
          placeholder="请输入异常类型名称"
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          onPressEnter={handleAdd}
          autoFocus
        />
      </Modal>

      {/* 编辑异常类型弹窗 */}
      <Modal
        title="编辑异常类型"
        open={showEditModal}
        onOk={handleEdit}
        onCancel={() => {
          setShowEditModal(false);
          setEditingType(null);
          setTypeName('');
        }}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="请输入异常类型名称"
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          onPressEnter={handleEdit}
          autoFocus
        />
      </Modal>
    </>
  );
}
