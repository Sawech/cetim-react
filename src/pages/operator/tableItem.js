import { useState, useEffect, useRef } from "react";

const TableItem = ({ item, variables, onUpdateValue }) => {
  const tableRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);

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
        // Skip cells with images
        if (cell.querySelector("img")) {
          cell.setAttribute("contenteditable", "false");
          return;
        }

        // Check for existing variable data attribute
        const hasVariable = cell.dataset.variable;

        // Check for variable pattern in content
        const tableContent = cell.textContent.trim();
        const varMatch = tableContent.match(/^{{(.*?)}}$/);

        if (hasVariable) {
          // This is a variable cell
          const varName = cell.dataset.variable;
          const variable = variables.find((v) => v.name === varName);

          if (variable) {
            cell.textContent = variable.computedValue;
            cell.dataset.variable = varName;
            cell.setAttribute("contenteditable", "true");

            // Add event listeners only for variable cells
            cell.onblur = (e) => handleCellBlur(e);
            cell.onmouseenter = (e) => {
              setHoveredCell({
                element: e.target,
                variable: variable,
              });
            };
            cell.onmouseleave = () => {
              setHoveredCell(null);
            };
          }
        } else {
          // This is a normal text cell
          cell.setAttribute("contenteditable", "false");
        }

        // Apply common styles
        cell.style.minWidth = "50px";
        cell.style.padding = "5px";
      });
    }
  }, [item.tableContent, variables]);

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
      } else {
        // If it's a complex variable, revert to the original value
        cell.textContent = variable.computedValue;
      }
    }
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

          <div style={tooltipRowStyle}>
            <span style={tooltipLabelStyle}>Value:</span>
            <span style={tooltipValueStyle}>
              {hoveredCell.variable.computedValue}
            </span>
          </div>

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

export default TableItem;
