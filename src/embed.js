import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ensureMobileViewport } from './utils/viewport.js';
import './styles/embed.css';
import '../index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // Optionally log error
  }
  render() {
    if (this.state.hasError) {
      return <div className="nexus-widget tw-p-4 tw-text-red-600">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

function mountWidget(container, config = {}) {
  if (!container) return;
  container.classList.add('nexus-widget');
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <App config={config} />
    </ErrorBoundary>
  );
}

function autoInit() {
  ensureMobileViewport();
  const containers = document.querySelectorAll('[data-nexus-widget]');
  containers.forEach(container => {
    const config = container.dataset || {};
    mountWidget(container, config);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

export { mountWidget }; 