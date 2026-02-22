import React, { useState, useEffect } from 'react';

const MealModal = ({ isOpen, onClose, onSave, member, type, initialValue }) => {
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDescription(initialValue?.description || '');
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(member, type, description);
        onClose();
    };

    return (
        <div className="modal-overlay fade-in">
            <div className="modal card">
                <h3>Plan {type}</h3>
                <p className="subtitle">for {member}</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Meal Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Aloo Gobi with Roti"
                            autoFocus
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Plan</button>
                    </div>
                </form>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          width: 90%;
          max-width: 500px;
          border: 1px solid rgba(56, 189, 248, 0.3);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .subtitle {
          color: var(--text-muted);
          margin-bottom: var(--spacing-md);
          font-size: 0.9rem;
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--spacing-sm);
          font-size: 0.875rem;
          color: var(--accent-secondary);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
        }
      `}</style>
        </div>
    );
};

export default MealModal;
