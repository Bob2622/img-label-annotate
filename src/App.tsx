import React from 'react';
import { Workspace } from './components/Workspace';
import './styles/design-system-dark.scss';
import './styles/workspace.scss';

// 设置深色模式
document.documentElement.setAttribute('data-theme', 'dark');

export default function App() {
  return (
    <div className="app">
      <Workspace />
    </div>
  );
}
