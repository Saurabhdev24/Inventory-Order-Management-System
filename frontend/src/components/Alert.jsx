import { useEffect } from 'react';

function Alert({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const alertClass = type === 'error' ? 'alert-box alert-error' : 'alert-box alert-success';

  return (
    <div className={alertClass}>
      <span className="alert-message">{message}</span>
      <button className="alert-close" onClick={onClose} aria-label="Close alert">
        &times;
      </button>
    </div>
  );
}

export default Alert;
