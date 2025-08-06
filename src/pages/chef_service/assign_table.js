import { useState, useEffect, useRef } from "react";

const AssignTable = ({ item, variables, onUpdateValue }) => {
  const tableRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Function to check if value is out of range
  const isValueOutOfRange = (value, min, max) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    return (
      (min !== undefined && numValue < parseFloat(min)) ||
      (max !== undefined && numValue > parseFloat(max))
    );
  };

  useEffect(() => {
    if (!tableRef.current) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(item.tableContent, "text/html");
    const table = doc.querySelector("table");

    if (table) {
      tableRef.current.innerHTML = "";
      tableRef.current.appendChild(table);

      const cells = table.querySelectorAll("td, th");
      cells.forEach((cell) => {
        if (cell.querySelector("img")) {
          cell.setAttribute("contenteditable", "false");
          return;
        }

        // Only make variable cells editable
        if (cell.dataset.variable) {
          const variable = variables.find(
            (v) => v.name === cell.dataset.variable
          );
          if (variable) {
            cell.textContent = variable.computedValue;
            // Check if value is out of range
            if (
              isValueOutOfRange(cell.textContent, variable.min, variable.max)
            ) {
              cell.style.backgroundColor = "orange";
            } else {
              cell.style.backgroundColor = "";
            }
          }
          cell.setAttribute("contenteditable", "true");
          cell.onblur = (e) => handleCellBlur(e);
        } else {
          // Non-variable cells are not editable
          cell.setAttribute("contenteditable", "false");
          // Remove any existing blur handler
          cell.onblur = null;
        }

        // Add hover events (keep these for all cells if you want tooltips on hover)
        cell.onmouseenter = (e) => {
          if (e.target.dataset.variable) {
            const variable = variables.find(
              (v) => v.name === e.target.dataset.variable
            );
            if (variable) {
              setHoveredCell({
                element: e.target,
                variable: variable,
              });
            }
          }
        };
        cell.onmouseleave = () => {
          setHoveredCell(null);
        };
      });
    }
  }, [item.tableContent, variables]);

  const handleCellBlur = (e) => {
    const cell = e.target;
    const tableContent = cell.textContent.trim();

    // Only handle updates to existing variables
    if (cell.dataset.variable) {
      const variable = variables.find((v) => v.name === cell.dataset.variable);

      // Check if the variable is simple (expression is just a number)
      const isSimpleVariable =
        variable && /^\d*\.?\d+$/.test(variable.expression);

      if (isSimpleVariable) {
        onUpdateValue(cell.dataset.variable, tableContent);
        // Check if new value is out of range
        if (isValueOutOfRange(tableContent, variable.min, variable.max)) {
          cell.style.backgroundColor = "orange";
        } else {
          cell.style.backgroundColor = "";
        }
      } else {
        // If it's a complex variable, revert to the original value
        cell.textContent = variable.computedValue;
        // Also check range for the original value
        if (
          isValueOutOfRange(variable.computedValue, variable.min, variable.max)
        ) {
          cell.style.backgroundColor = "orange";
        } else {
          cell.style.backgroundColor = "";
        }
      }
    }

    // Handle variable retrieval ({{name}} syntax)
    const varMatch = tableContent.match(/^{{(.*?)}}$/);
    if (varMatch) {
      const varName = varMatch[1];
      const variable = variables.find((v) => v.name === varName);
      if (variable) {
        cell.textContent = variable.computedValue;
        cell.dataset.variable = varName;
        // Check if value is out of range
        if (isValueOutOfRange(cell.textContent, variable.min, variable.max)) {
          cell.style.backgroundColor = "orange";
        } else {
          cell.style.backgroundColor = "";
        }
      }
    }
  };

  // Tooltip styles
  const tooltipStyle = {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    zIndex: 1000,
    pointerEvents: "none",
    minWidth: "200px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  };

  const tooltipRowStyle = {
    display: "flex",
    margin: "4px 0",
  };

  const tooltipLabelStyle = {
    fontWeight: "bold",
    marginRight: "10px",
    color: "#ccc",
  };

  const tooltipValueStyle = {
    textAlign: "right",
  };
  return (
    <div style={{ position: "relative" }}>
      <div className="table-item" ref={tableRef} />

      {hoveredCell && (
        <div
          style={{
            ...tooltipStyle,
            top: `${
              hoveredCell.element.offsetTop +
              hoveredCell.element.offsetHeight +
              5
            }px`,
            left: `${hoveredCell.element.offsetLeft}px`,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
            <span>Nom: </span>
            <span>{hoveredCell.variable.name}</span>
          </div>

          {/* <div style={tooltipRowStyle}>
            <span style={tooltipLabelStyle}>Value:</span>
            <span style={tooltipValueStyle}>
              {hoveredCell.variable.computedValue}
            </span>
          </div> */}

          {hoveredCell.variable.min && (
            <div style={tooltipRowStyle}>
              <span style={tooltipLabelStyle}>Min:</span>
              <span style={tooltipValueStyle}>{hoveredCell.variable.min}</span>
            </div>
          )}

          {hoveredCell.variable.max && (
            <div style={tooltipRowStyle}>
              <span style={tooltipLabelStyle}>Max:</span>
              <span style={tooltipValueStyle}>{hoveredCell.variable.max}</span>
            </div>
          )}

          {hoveredCell.variable.unit && (
            <div style={tooltipRowStyle}>
              <span style={tooltipLabelStyle}>Unit:</span>
              <span style={tooltipValueStyle}>{hoveredCell.variable.unit}</span>
            </div>
          )}

          {hoveredCell.variable.expression && (
            <div
              style={{
                marginTop: "6px",
                paddingTop: "6px",
                borderTop: "1px solid #555",
                fontSize: "12px",
                color: "#aaa",
              }}
            >
              Expression: {hoveredCell.variable.expression}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignTable;
