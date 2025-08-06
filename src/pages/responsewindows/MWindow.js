import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/MWindow.css"; // Ensure the correct path to your CSS file

const MessageModal = ({ message, onClose, redirectTo, type }) => {
  const navigate = useNavigate();

  if (!message) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={handleClose} className="modal-close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default MessageModal;