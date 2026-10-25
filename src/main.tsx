import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🛡️ [App Guard] Intercepted runtime error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#240608] text-amber-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#380b10] border-2 border-amber-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="text-4xl text-amber-300">ॐ</div>
            <h2 className="text-xl font-bold font-serif text-amber-200">
              श्री सिद्धेश्वर धाम • भारत उत्कर्ष महायज्ञ २०२६
            </h2>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              ऐप में एक क्षणिक तकनीकी रुकावट आई है। कृपया पुनः प्रयास करें।
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-xl shadow-lg cursor-pointer transition-all text-sm"
            >
              🔄 पेज पुनः लोड करें (Reload)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
