import "@/styles/components/_confirmModal.scss";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  requireConfirm = false,
  confirmValue = "DELETE",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">{title}</h3>
        <div className="modal__body">{message}</div>

        {requireConfirm && (
          <label className="modal__checkbox">
            <input type="checkbox" id="confirm-check" />
            <span>
              Type <strong>{confirmValue}</strong> to confirm
            </span>
          </label>
        )}

        <div className="modal__actions">
          <button onClick={onCancel} className="btn btn--outline">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
            disabled={requireConfirm && document.getElementById("confirm-check")?.checked !== true}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}