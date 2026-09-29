import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled React Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f7fb",
          padding: "20px"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ margin: "0 0 12px", color: "#1e293b" }}>Something went wrong</h2>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" }}>
              An unexpected error occurred while rendering the page.
            </p>
            <div style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "20px",
              textAlign: "left",
              fontFamily: "monospace",
              wordBreak: "break-word"
            }}>
              {this.state.error?.message || String(this.state.error)}
            </div>
            <button
              onClick={this.handleReset}
              style={{
                width: "100%",
                padding: "12px",
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);