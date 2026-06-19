import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import './index.css';

const container = document.querySelector('#root');
if (!container) {
  throw new Error('Root container #root not found');
}

// Mol* manages its own subtree and is not StrictMode-double-mount safe, so the
// app is mounted without StrictMode.
createRoot(container).render(<App />);
