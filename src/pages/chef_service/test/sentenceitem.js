const SentenceItem = ({ item, onRemove, onMoveUp, onMoveDown }) => {
  return (
    <div className="item-container">
      <div className={`sentence-item ${item.type === 'title' ? 'title-item' : ''}`}>
        <p>{item.text}</p>
      </div>
      <div className="controls">
        <div className="position-controls">
          <button className="position-btn" onClick={onMoveUp}>
            ↑
          </button>
          <button className="position-btn" onClick={onMoveDown}>
            ↓
          </button>
        </div>
        <button className="remove-button" onClick={onRemove}>
          ×
        </button>
      </div>
    </div>
  );
};

export default SentenceItem;