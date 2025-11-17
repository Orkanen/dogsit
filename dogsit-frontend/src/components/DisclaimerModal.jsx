export default function DisclaimerModal({ isOpen, onClose }) {
    if (!isOpen) return null;
  
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}
        onClick={onClose} // close when clicking backdrop
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '1.5rem',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#666',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Close disclaimer"
          >
            ×
          </button>
  
          {/* Title */}
          <h3
            style={{
              marginTop: 0,
              marginBottom: '1rem',
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#b45309',
            }}
          >
            Safety Disclaimer
          </h3>
  
          {/* Body */}
          <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem' }}>
            We recommend that <strong>sitters</strong> and <strong>owners</strong> always remain{' '}
            <strong>truthful</strong> and <strong>humble</strong>. Misrepresenting skills or a dog’s behavior can lead to:
          </p>
  
          <ul
            style={{
              fontSize: '0.9rem',
              margin: '1rem 0',
              paddingLeft: '1.5rem',
              lineHeight: '1.6',
            }}
          >
            <li>Injury to yourself</li>
            <li>Damage to property</li>
            <li>Harm to animals</li>
            <li>Danger to others</li>
          </ul>
  
          <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#92400e', marginBottom: '0.5rem' }}>
            <strong>We are a hosting platform only.</strong> We do not take responsibility for services arranged through us.
          </p>
  
          <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#92400e' }}>
            We claim the right to terminate accounts that do not share our values or disregard their own or others’ safety.
          </p>
  
          {/* Action Button */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    );
  }