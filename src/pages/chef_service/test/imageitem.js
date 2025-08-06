const ImageItem = ({ item, onRemove, onMoveUp, onMoveDown }) => {
  return (
    <div className="item-container">
      <div className="image-item">
        <img
          src={`https://cetim-spring.onrender.com/uploads/${item.text}`}
          alt={`uploaded-${item.id}`}
        />
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

export default ImageItem;
