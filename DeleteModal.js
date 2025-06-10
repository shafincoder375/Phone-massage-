
import React from "react";
import "./App.css";

const DeleteModal = ({ showModal, handleDelete, msgKey, closeModal }) => {
  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Message</h3>
        <button onClick={() => handleDelete(msgKey, "everyone")}>
          Delete from Everyone
        </button>
        <button onClick={() => handleDelete(msgKey, "me")}>Delete for Me</button>
        <button onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
};

export default DeleteModal;
