import React from 'react';

const MealSlot = ({ member, type, meal, onEdit }) => {
    const isFilled = !!meal;

    return (
        <div
            className={`meal-slot ${isFilled ? 'filled' : 'empty'}`}
            onClick={() => onEdit(member, type, meal)}
        >
            <div className="slot-header">
                <span className="meal-type">{type}</span>
            </div>
            <div className="slot-content">
                {isFilled ? (
                    <span className="meal-name">{meal.description}</span>
                ) : (
                    <span className="placeholder">+ Add Meal</span>
                )}
            </div>

            <style>{`
        .meal-slot {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: var(--spacing-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-height: 100px;
          display: flex;
          flex-direction: column;
        }

        .meal-slot:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .meal-slot.filled {
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.2);
        }

        .slot-header {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: var(--spacing-xs);
        }

        .meal-name {
          font-weight: 500;
          color: var(--text-main);
        }

        .placeholder {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-style: italic;
        }
      `}</style>
        </div>
    );
};

export default MealSlot;
