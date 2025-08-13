import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AuthService from "../../services/login_service";
import Sidebar from "../commun/sidebare.js";
import axios from "axios";
import TableItem from "./tableItem";
import "../../styles/assigned.css"; // Import the new CSS file

const Assigned = () => {
  const user = AuthService.getCurrentUser();
  const { assignId, testId } = useParams();
  const [variables, setVariables] = useState([]);
  const [items, setItems] = useState([]);
  const [essai, setEssai] = useState([]);
  const [test, setTest] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      if (!testId || !assignId) return;

      try {
        // Execute all requests in parallel where possible
        const [testRes, assignRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/tests/${testId}`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE_URL}/api/assigns/${assignId}`, {
            withCredentials: true,
          }),
        ]);

        // Mark assignment as read after getting initial data
        await axios.put(`${API_BASE_URL}/api/assigns/read/${assignId}`, null, {
          withCredentials: true,
        });

        // Get additional details if needed
        const detailsRes = await axios.get(
          `${API_BASE_URL}/api/fichedessai/details/${assignRes.data.ficheDessaiId}`,
          {
            withCredentials: true,
          }
        );
        // Process test data
        const elements = testRes.data.elements
          .filter((element) => !element.important || element.side === "right")
          .sort((a, b) => a.position - b.position)
          .map((element) => {
            switch (element.type) {
              case "sentence":
                return {
                  id: element.id,
                  type: "sentence",
                  text: element.content,
                };
              case "title":
                return {
                  id: element.id,
                  type: "title",
                  text: element.content,
                };
              case "image":
                return {
                  id: element.id,
                  type: "image",
                  text: element.content,
                };
              case "table":
                return {
                  id: element.id,
                  type: "table",
                  tableContent: element.tableContent,
                  side: element.side,
                };
              default:
                return null;
            }
          })
          .filter((item) => item !== null);

        // Process variables
        const variables = (testRes.data.variables || []).map((variable) => ({
          ...variable,
          name: variable.name || "",
          expression: variable.expression || "",
          computedValue: variable.computedValue || 0,
          min: variable.min,
          max: variable.max,
          unit: variable.unit,
        }));

        // Compute dependent variables
        const updatedVariables = variables.map((item) => {
          if (!/^\d*\.?\d+$/.test(item.expression)) {
            try {
              const substitutedExpression = replaceVariables(
                item.expression,
                variables
              );
              const evalExpression = replaceMathFunctions(
                substitutedExpression
              );
              return {
                ...item,
                computedValue: eval(evalExpression),
              };
            } catch (error) {
              console.error(`Error recomputing variable ${item.name}:`, error);
              return item;
            }
          }
          return item;
        });

        // Remove duplicate variables
        const reducedVariables = [...updatedVariables]
          .reverse()
          .reduce((acc, element) => {
            if (!acc.some((e) => e.name === element.name)) {
              acc.push(element);
            }
            return acc;
          }, [])
          .reverse();

        // Update state
        setVariables(reducedVariables);
        setItems(elements);
        setTest(testRes.data);
        setEssai(detailsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setStatusMessage({
          text: "Failed to load data",
          type: "error",
        });
      }
    };

    fetchData();
  }, [testId, assignId]); // Added assignId to dependencies

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/tests/variables/updates`
    );

    eventSource.addEventListener("variable-updated", (e) => {
      const updatedVariable = JSON.parse(e.data);
      setVariables((prevVariables) => {
        // Create a new array with updated variable
        const updatedVariables = prevVariables.map(
          (item) =>
            item.name === updatedVariable.name
              ? { ...updatedVariable } // Create new object with updated values
              : { ...item } // Clone other variables
        );

        // Recompute all dependent variables
        return updatedVariables.map((item) => {
          if (!/^\d*\.?\d+$/.test(item.expression)) {
            try {
              let substitutedExpression = replaceVariables(
                item.expression,
                updatedVariables
              );
              let evalExpression = replaceMathFunctions(substitutedExpression);
              return {
                ...item,
                computedValue: eval(evalExpression),
              };
            } catch (error) {
              console.error(`Error recomputing variable ${item.name}:`, error);
              return item;
            }
          }
          return item;
        });
      });
    });

    return () => eventSource.close();
  }, []);

  // Helper function to replace sqrt() and pow() with Math.sqrt() and Math.pow()
  const replaceMathFunctions = (expr) => {
    return expr
      .replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)") // Replace sqrt(x) with Math.sqrt(x)
      .replace(/pow\(([^,]+),([^)]+)\)/g, "Math.pow($1,$2)"); // Replace pow(x,y) with Math.pow(x,y)
  };

  const replaceVariables = (expr, items) => {
    let result = expr;
    items.forEach((item) => {
      result = result.replace(
        new RegExp(`\\b${item.name}\\b`, "g"),
        item.computedValue
      );
    });
    return result;
  };

  const updateVariableValue = async (varName, newValue) => {
    const updatedVariables = [...variables];
    const variable = updatedVariables.find((item) => item.name === varName);

    if (!variable) {
      console.warn(`Variable ${varName} not found`);
      return;
    }

    if (isNaN(newValue)) {
      return;
    }

    // Update the variable value
    variable.computedValue = parseFloat(newValue);

    // If it's an independent variable, update the expression too
    if (/^\d*\.?\d+$/.test(variable.expression)) {
      variable.expression = newValue.toString();
    }

    const computedVariables = variables.map((item) => {
      if (!/^\d*\.?\d+$/.test(item.expression)) {
        // If the variable is dependent, recompute its value
        try {
          // First replace variables with their values
          let substitutedExpression = replaceVariables(
            item.expression,
            updatedVariables
          );

          // Then replace math functions
          let evalExpression = replaceMathFunctions(substitutedExpression);

          item.computedValue = eval(evalExpression);
        } catch (error) {
          console.error(`Error recomputing variable ${item.name}:`, error);
        }
      }
    });

    try {
      // Send update to backend
      const response = await axios.post(
        `${API_BASE_URL}/api/tests/variable`,
        {
          testId: testId,
          variableId: variable.id,
          computedValue: variable.computedValue,
          expression: variable.expression,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // Update the items state with the new variable from the response
      const newVariable = response.data;
      const newVariables = updatedVariables.map((item) => {
        if (item.id === variable.id) {
          return {
            ...item,
            id: newVariable.id,
          };
        }
        return item;
      });
      setVariables(newVariables);
    } catch (error) {
      console.error("Error updating element in backend:", error);
      // Optionally, you could revert the local changes if the backend update fails
    }
  };
  return (
    <div className="assigned-container">
      <Sidebar roles={user ? user.roles : []} />
      <div className="assigned-content">
        <div className="assigned-header">
          <h2>{test.testName}</h2>
        </div>

        {/* List of items (variables, sentences, and images) */}
        <div className="items-container">
          {/* First, sort items to put right-side tables first */}
          {[...items]
            .sort((a, b) => {
              // Put right-side tables first
              if (a.type === "table" && a.side === "right") return -1;
              if (b.type === "table" && b.side === "right") return 1;
              return 0;
            })
            .map((item, index) => (
              <div key={index} className="item-row">
                {item.type === "table" && item.side === "right" && (
                  <div className="combined-table-container">
                    <table className="combined-table">
                      <tbody>
                        <tr>
                          <td>Code echantillon</td>
                          <td>
                            {
                              essai.ficheDessai?.order?.echantillon
                                ?.echantillonCode
                            }
                          </td>
                        </tr>
                        {(() => {
                          try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(
                              item.tableContent,
                              "text/html"
                            );
                            const rightTableRows = doc.querySelectorAll("tr");
                            return Array.from(rightTableRows).map(
                              (row, rowIndex) => (
                                <tr key={`right-${rowIndex}`}>
                                  {Array.from(row.children).map(
                                    (cell, cellIndex) => (
                                      <td
                                        key={`right-${rowIndex}-${cellIndex}`}
                                        dangerouslySetInnerHTML={{
                                          __html: cell.innerHTML,
                                        }}
                                      />
                                    )
                                  )}
                                </tr>
                              )
                            );
                          } catch (error) {
                            console.error("Error parsing right table:", error);
                            return null;
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
                {item.type === "sentence" && (
                  <div className="sentence-item">
                    <p>{item.text}</p>
                  </div>
                )}
                {item.type === "title" && (
                  <div className="title-item">
                    <p>{item.text}</p>
                  </div>
                )}
                {item.type === "image" && (
                  <div className="image-item">
                    <img
                      src={`${API_BASE_URL}/uploads/${item.text}`}
                      alt={`uploaded-${index}`}
                      style={{
                        maxWidth: "none",
                      }}
                    />
                  </div>
                )}
                {item.type === "table" && item.side === "main" && (
                  <TableItem
                    key={item.id}
                    item={{
                      tableContent: item.tableContent,
                      id: item.id,
                    }}
                    variables={variables}
                    onUpdateValue={updateVariableValue}
                  />
                )}
              </div>
            ))}
        </div>

        {/* Status message */}
        {statusMessage.text && (
          <div className={`status-message status-${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assigned;
