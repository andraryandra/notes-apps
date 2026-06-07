import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './hooks/useToast';
import './styles/global.css';

/** Cegah Chromium/Electron unduh atau buka tab saat file di-drop ke window */
function blockNativeFileDrop(e: DragEvent) {
  if (!e.dataTransfer?.types?.includes('Files')) return;
  e.preventDefault();
  if (e.type === 'dragover') {
    e.dataTransfer.dropEffect = 'copy';
  }
}

document.addEventListener('dragover', blockNativeFileDrop, true);
document.addEventListener('drop', blockNativeFileDrop, true);

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', color: '#f4f4f5', background: '#0a0a0d', minHeight: '100vh' }}>
          <h2>Notes — error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fca5a5' }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);
