import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { replaceVariables, replaceMathFunctions } from "./variableutils";

const TableItem = ({
  item,
  onRemove,
  onUpdate,
  variables,
  onCreateVariable,
  onUpdateValue,
  onMoveUp,
  onMoveDown,
}) => {
  const tableRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!item.tableContent || !tableRef.current) return;
    if (variables.some((v) => v === undefined)) {
      setIsLoading(true);
      return;
    }
    setIsLoading(false);

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
        if (cell.dataset.variable) {
          const variable = variables.find(
            (v) => v.name === cell.dataset.variable
          );
          if (variable && cell.textContent !== variable.computedValue) {
            cell.textContent = variable.computedValue;
          }
        }

        const tableContent = cell.textContent.trim();
        const varMatch = tableContent.match(/^{{(.*?)}}$/);

        if (varMatch) {
          const varName = varMatch[1];
          const variable = variables.find((v) => v.name === varName);
          if (variable && variable.computedValue !== undefined) {
            cell.textContent = variable.computedValue;
            cell.dataset.variable = varName;
          }
        }

        cell.setAttribute("contenteditable", "true");
        cell.style.minWidth = "50px";
        cell.style.padding = "5px";
        cell.onblur = (e) => handleCellBlur(e);

        // Add hover events
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
  }, [item.tableContent]);

  // Style for the tooltip
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

    if (tableContent.startsWith("image:")) {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = async (fileEvent) => {
        const file = fileEvent.target.files[0];
        if (file) {
          try {
            const formData = new FormData();
            formData.append("file", file);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
            const response = await axios.post(
              `${API_BASE_URL}/api/tests/upload-image`,
              formData
            );
            const imageUrl = response.data;
            cell.innerHTML = `<img src="${API_BASE_URL}/uploads/${imageUrl}"" style="max-width: 100px; max-height: 100px;" />`;
            onUpdate(tableRef.current.firstChild.outerHTML);
          } catch (error) {
            console.error("Image upload failed:", error);
            cell.textContent = "Upload failed";
          }
        }
      };
      fileInput.click();
      return;
    }

    if (tableContent.includes("=")) {
      const [varName, expr] = tableContent.split("=").map((s) => s.trim());

      if (!expr) {
        // Handle case where there's only a variable name
        const variable = variables.find((v) => v.name === varName);
        if (variable && variable.computedValue !== undefined) {
          cell.textContent = variable.computedValue;
          cell.dataset.variable = varName;
        } else {
          cell.textContent = 0;
          cell.dataset.variable = varName;
        }
        onCreateVariable(varName, "0");
        return;
      }

      try {
        // Check for IF condition pattern: if(condition, trueValue, falseValue)
        const ifMatch = expr.match(/^if\s*\((.*?)\s*,\s*(.*?)\s*,\s*(.*?)\)$/i);

        let tempValue;
        if (ifMatch) {
          // This is an IF condition
          const [_, condition, trueValue, falseValue] = ifMatch;

          // Evaluate the condition
          const conditionResult = eval(
            replaceMathFunctions(replaceVariables(condition, variables))
          );

          // Evaluate the appropriate branch
          const branchToEvaluate = conditionResult ? trueValue : falseValue;
          tempValue = eval(
            replaceMathFunctions(replaceVariables(branchToEvaluate, variables))
          );
        } else {
          // Regular expression
          tempValue = eval(
            replaceMathFunctions(replaceVariables(expr, variables))
          );
        }

        cell.textContent = tempValue;
        cell.dataset.variable = varName;
      } catch (error) {
        console.error("Error evaluating expression:", error);
      }

      if (tableRef.current?.firstChild) {
        onUpdate(tableRef.current.firstChild.outerHTML);
      }
      onCreateVariable(varName, expr);
      return;
    }
    if (
      cell.textContent &&
      tableContent &&
      !tableContent.match(/^{{(.*?)}}$/)
    ) {
      if (!cell.dataset.variable) {
        return;
      }
      onUpdateValue(cell.dataset.variable, tableContent);

      if (tableRef.current?.firstChild) {
        onUpdate(tableRef.current.firstChild.outerHTML);
      }
    }

    const varMatch = tableContent.match(/^{{(.*?)}}$/);
    if (varMatch) {
      const varName = varMatch[1];
      const variable = variables.find((v) => v.name === varName);
      if (variable && variable.computedValue !== undefined) {
        cell.textContent = variable.computedValue;
        cell.dataset.variable = varName;
      }
    }

    if (tableRef.current?.firstChild) {
      onUpdate(tableRef.current.firstChild.outerHTML);
    }
  };

  if (isLoading) return;
  return (
    <div className="item-container">
      <div className="table-item" ref={tableRef} />
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
      {hoveredCell && (
        <div
          style={{
            position: "fixed",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            zIndex: 1000,
            pointerEvents: "none",
            minWidth: "200px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            top: `${hoveredCell.element.getBoundingClientRect().bottom + 5}px`,
            left: `${hoveredCell.element.getBoundingClientRect().left}px`,
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "6px",
              paddingBottom: "4px",
            }}
          >
            <span>Nom: </span>
            <span>{hoveredCell.variable.name}</span>
          </div>

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

export default TableItem;
