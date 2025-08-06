const VariableItem = ({
  item,
  index,
  onRemove,
  onToggleImportant,
  onUpdateValue,
  onUpdateUnit,
  onUpdateMin,
  onUpdateMax,
}) => {
  return (
    <div className="item-card">
      <div className="variable-item">
        <div className="variable-content">
          <strong>{item.name} :</strong>
          <span>{item.expression}</span>
          {!/^\d*\.?\d+$/.test(item.expression) && (
            <span>= {item.computedValue}&nbsp;</span>
          )}
          {/^\d*\.?\d+$/.test(item.expression) && (
            <input
              type="number"
              value={item.computedValue}
              onChange={(e) => onUpdateValue(item.name ,parseFloat(e.target.value))}
              placeholder="value"
            />
          )}
          (
          <input
            type="number"
            value={item.min}
            onChange={(e) => onUpdateMin(e.target.value)}
            placeholder="Min"
          />{" "}
          -
          <input
            type="number"
            value={item.max}
            onChange={(e) => onUpdateMax(e.target.value)}
            placeholder="Max"
          />
          )
          <input
            type="text"
            value={item.unit}
            onChange={(e) => onUpdateUnit(e.target.value)}
            placeholder="Unit"
          />
        </div>
        <div className="variable-actions">
          <button
            className={`important-button ${item.important ? "active" : ""}`}
            onClick={onToggleImportant}
          >
            {item.important ? "★ Important" : "☆ Mark"}
          </button>
          <button className="remove-button" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariableItem;