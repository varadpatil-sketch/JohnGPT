import React, { useState, useEffect } from "react";
import { Sliders, X, Check, Info } from "lucide-react";

export default function CustomInstructionsModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}) {
  const [enabled, setEnabled] = useState(true);
  const [aboutUser, setAboutUser] = useState("");
  const [responseStyle, setResponseStyle] = useState("");

  useEffect(() => {
    if (initialData) {
      setEnabled(initialData.enabled ?? true);
      setAboutUser(initialData.aboutUser || "");
      setResponseStyle(initialData.responseStyle || "");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      enabled,
      aboutUser: aboutUser.trim(),
      responseStyle: responseStyle.trim(),
    });
    onClose();
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div
        className="modal-card custom-instructions-card scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title-icon">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="modal-title">Custom Instructions</h2>
              <p className="modal-subtitle">
                Personalize how JohnGPT responds across all conversations
              </p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body custom-instructions-body">
          <div className="instruction-toggle-row">
            <div>
              <span className="toggle-label">Enable for new responses</span>
              <p className="toggle-subtext">
                When enabled, JohnGPT automatically follows these instructions
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="instruction-field">
            <label className="field-label">
              What would you like JohnGPT to know about you to provide better responses?
            </label>
            <p className="field-hint">
              E.g., your profession, expertise level, preferred tech stack, or location.
            </p>
            <textarea
              className="instruction-textarea"
              rows={4}
              maxLength={1500}
              placeholder="e.g., I'm a senior full-stack engineer building production web apps in React and Python. Assume strong technical familiarity."
              value={aboutUser}
              onChange={(e) => setAboutUser(e.target.value)}
            />
            <div className="char-counter">{aboutUser.length} / 1500</div>
          </div>

          <div className="instruction-field">
            <label className="field-label">
              How would you like JohnGPT to respond?
            </label>
            <p className="field-hint">
              E.g., tone, depth, format preferences, or guidelines on explanations.
            </p>
            <textarea
              className="instruction-textarea"
              rows={4}
              maxLength={1500}
              placeholder="e.g., Be concise, direct, and pragmatic. Avoid fluff or introductory pleasantries. Provide production-ready code with types and comments."
              value={responseStyle}
              onChange={(e) => setResponseStyle(e.target.value)}
            />
            <div className="char-counter">{responseStyle.length} / 1500</div>
          </div>

          <div className="instruction-info-box">
            <Info size={16} />
            <span>
              Instructions are injected safely into JohnGPT's context without overriding tool execution or security guardrails.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-modal-save" onClick={handleSave}>
            <Check size={16} />
            <span>Save Instructions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
