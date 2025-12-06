export default function RequestJoinModal({ isOpen, onClose, state = "loading", message }) {
    if (!isOpen) return null;
  
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem",
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            maxWidth: "420px",
            width: "100%",
            padding: "2rem",
            position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button (only show when not loading) */}
          {state !== "loading" && (
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                fontSize: "2rem",
                color: "#999",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ×
            </button>
          )}
  
          {/* Loading */}
          {state === "loading" && (
            <>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  border: "5px solid #f3f4f6",
                  borderTop: "5px solid #f59e0b",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 1rem",
                }}
              />
              <h3 style={{ color: "#92400e", margin: "0.5rem 0" }}>Sending Request…</h3>
              <p style={{ color: "#666", fontSize: "0.95rem" }}>
                Letting the kennel owner know you're interested
              </p>
            </>
          )}
  
          {/* Success */}
          {state === "success" && (
            <>
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  backgroundColor: "#d1fae5",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "36px",
                  color: "#065f46",
                }}
              >
                ✓
              </div>
              <h3 style={{ color: "#065f46" }}>Request Sent!</h3>
              <p style={{ color: "#065f46", fontWeight: "500" }}>
                {message || "The owner will review your request soon."}
              </p>
            </>
          )}
  
          {/* Error */}
          {state === "error" && (
            <>
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  backgroundColor: "#fee2e2",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "36px",
                  color: "#991b1b",
                }}
              >
                ✗
              </div>
              <h3 style={{ color: "#991b1b" }}>Something went wrong</h3>
              <p style={{ color: "#991b1b", fontWeight: "500" }}>
                {message || "Please try again later."}
              </p>
            </>
          )}
        </div>
  
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }