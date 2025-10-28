import React from "react";
import { Layout, Menu, theme } from "antd";
import { AppstoreOutlined, PictureOutlined } from "@ant-design/icons";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import DatasetPage from "./pages/DatasetPage";
import LabelingPage from "./pages/LabelingPage";
import { useEffect, useState } from "react";
import "./app.scss";

const { Header, Sider, Content, Footer } = Layout;

function AppLayout() {
  const location = useLocation();
  const selectedKey = location.pathname.startsWith("/label")
    ? "label"
    : "dataset";
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout className="app-layout">
      <Sider breakpoint="lg" collapsedWidth="64">
        <div className="app-logo">
          图片标注平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: "dataset",
              icon: <AppstoreOutlined />,
              label: <Link to="/datasets">数据集</Link>,
            },
            {
              key: "label",
              icon: <PictureOutlined />,
              label: <Link to="/label">图片标注</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header" style={{ background: colorBgContainer }} />
        <Content className="app-content">
          <div className="app-content-inner" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Routes>
              <Route path="/datasets" element={<DatasetPage />} />
              <Route path="/label" element={<LabelingPage />} />
              <Route path="/label/:datasetId" element={<LabelingPage />} />
              <Route path="/" element={<Navigate to="/datasets" replace />} />
              <Route path="*" element={<Navigate to="/datasets" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
