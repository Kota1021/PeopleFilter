import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'

// iOS Safari: タブ復帰時に既存DOMノードの描画レイヤーが失われる問題の対策。
// HTMLの<div id="root">を再利用せず、JSで新規作成した要素に置換してからマウントする。
const existing = document.getElementById('root')
const root = document.createElement('div')
root.id = 'root'
if (existing) {
  existing.replaceWith(root)
} else {
  document.body.appendChild(root)
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
