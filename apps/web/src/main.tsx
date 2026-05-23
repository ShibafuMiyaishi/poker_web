import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// 永続化されたフォントサイズと motion 設定を即時反映 (FOUC 回避)
const fontScale = Number.parseFloat(localStorage.getItem('pokergo_font_scale') ?? '1');
if (Number.isFinite(fontScale) && fontScale !== 1) {
  document.documentElement.style.setProperty('font-size', `${fontScale * 16}px`);
}
const motionEnabled = (localStorage.getItem('pokergo_motion') ?? '1') === '1';
if (!motionEnabled) document.documentElement.setAttribute('data-reduce-motion', '1');

const root = document.getElementById('root');
if (!root) throw new Error('root element not found');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
