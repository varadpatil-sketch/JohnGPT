import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global React Error Boundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#090d16",
          color: "#f8fafc",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
          textAlign: "center"
        }}>
          <div style={{
            maxWidth: "520px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
          }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px", color: "#c084fc" }}>
              Something interrupted JohnGPT
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "20px", lineHeight: 1.5 }}>
              A rendering error occurred while displaying content. Your conversations and responses are safely saved in memory.
            </p>
            {this.state.error?.message && (
              <pre style={{
                textAlign: "left",
                background: "rgba(0, 0, 0, 0.4)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "#f87171",
                overflowX: "auto",
                marginBottom: "20px"
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                border: "none",
                borderRadius: "10px",
                padding: "10px 24px",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              Reload Interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)

