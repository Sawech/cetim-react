import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthService from "../../services/login_service";
import "../../styles/show-assign.css";
import Sidebar from "../commun/sidebare";
import AssignTable from "./assign_table";

const ShowAssign = () => {
  const { id } = useParams();
  const [essei, setEssei] = useState({});
  const [groups, setGroups] = useState([]);
  const [executionDates, setExecutionDates] = useState({});
  const [operateurs, setOperateurs] = useState([]);
  const currentUser = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  const fetchData = async () => {
    try {
      // 1. Parallelize initial data fetching
      const [assignsRes, testsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/assigns`),
        axios.get(`${API_BASE_URL}/api/tests`),
        axios.get(`${API_BASE_URL}/api/users`),
      ]);

      // 2. Filter assigns once
      const filteredAssigns = assignsRes.data.filter(
        (assign) => assign.assignNumber.toString() === id
      );

      if (filteredAssigns.length === 0) {
        alert("No assigns found for this test ID");
        navigate("/Chef_service-dashboard");
        return;
      }

      // 3. Create lookup maps early
      const testMap = new Map(testsRes.data.map((test) => [test.id, test]));
      const userMap = new Map(usersRes.data.map((user) => [user.id, user]));

      // 4. Get ficheDessai details if needed (parallelizable)
      const ficheDessaiId = filteredAssigns[0]?.ficheDessaiId;
      const esseisRes = ficheDessaiId
        ? await axios.get(
            `${API_BASE_URL}/api/fichedessai/details/${ficheDessaiId}`,
            {
              withCredentials: true,
            }
          )
        : { data: {} };
      setEssei(esseisRes.data || {});

      // 5. Process tests and assigns more efficiently
      const testIdSet = new Set(filteredAssigns.map((assign) => assign.testId));

      // 6. Create test-to-assign mapping including sub-tests
      const testToAssignMap = new Map();
      filteredAssigns.forEach((assign) => {
        const test = testMap.get(assign.testId);
        if (!test) return;

        testToAssignMap.set(assign.testId, assign);

        if (test.complexeTest) {
          test.subTestIds?.forEach((subTestId) => {
            testToAssignMap.set(subTestId, assign);
          });
        }
      });

      // 7. Filter tests in one pass
      const filteredTests = [];
      testIdSet.forEach((testId) => {
        const test = testMap.get(testId);
        if (!test) return;

        if (!test.complexeTest) {
          filteredTests.push(test);
        } else {
          test.subTestIds?.forEach((subTestId) => {
            const subTest = testMap.get(subTestId);
            if (subTest) filteredTests.push(subTest);
          });
        }
      });

      // 8. Process groups with pre-computed data
      const createdGroups = filteredTests
        .map((test) => {
          const assign = testToAssignMap.get(test.id);
          if (!assign) {
            console.warn(`No assign found for test ${test.id}`);
            return null;
          }

          const user = userMap.get(assign.userId);

          // Process elements more efficiently
          const initialItems = (test.elements || [])
            .filter((element) => element.important)
            .sort((a, b) => a.position - b.position)
            .map((element) => {
              if (element.type === "sentence" || element.type === "image") {
                return {
                  id: element.id,
                  type: "elm",
                  text: element.content,
                };
              }
              if (element.type === "title") {
                return {
                  id: element.id,
                  type: "title",
                  text: element.content,
                };
              }
              if (element.type === "table") {
                return {
                  id: element.id,
                  type: "table",
                  tableContent: element.tableContent,
                  side: element.side,
                };
              }
              return null;
            })
            .filter(Boolean);

          const variables = (test.variables || [])
            .reverse() // Reverse to keep the last occurrence of duplicates
            .reduce((acc, variable) => {
              const exists = acc.some((e) => e.name === variable.name);
              if (!exists) acc.push(variable);
              return acc;
            }, [])
            .reverse() // Restore original order
            .map((variable) => {
              return {
                id: variable.id,
                name: variable.name,
                expression: variable.expression,
                computedValue: variable.computedValue,
                min: variable.min,
                max: variable.max,
                unit: variable.unit,
              };
            });

          const updatedVariables = [...variables];
          updatedVariables.forEach((item) => {
            if (!/^\d*\.?\d+$/.test(item.expression)) {
              // If the variable is dependent, recompute its value
              try {
                // First replace variables with their values
                let substitutedExpression = replaceVariables(
                  item.expression,
                  updatedVariables
                );
                // Then replace math functions
                let evalExpression = replaceMathFunctions(
                  substitutedExpression
                );

                item.computedValue = eval(evalExpression);
              } catch (error) {
                console.error(
                  `Error recomputing variable ${item.name}:`,
                  error
                );
              }
            }
          });

          // Process variables and dependencies
          const variableMap = new Map();
          variables.forEach((variable) => {
            variableMap.set(variable.name, variable);
          });
          return {
            assignId: assign?.id || null,
            user: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
            userId: user?.id || null,
            elements: initialItems,
            variables: variables,
            dateExec: assign.dateExec,
            groupId: test.id,
          };
        })
        .filter(Boolean); // Remove null groups

      // 9. Initialize dates
      const initialDates = {};
      const today = formatDate(new Date());
      createdGroups.forEach((group) => {
        initialDates[group.groupId] = today;
      });

      // 10. Update state once at the end
      setExecutionDates(initialDates);
      setGroups(createdGroups);
      setOperateurs(
        usersRes.data.filter(
          (user) =>
            user.role === "Operateur" && user.service === currentUser.service
        )
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/tests/variables/saves`
    );

    eventSource.addEventListener("variable-saved", (e) => {
      const updatedVariable = JSON.parse(e.data);
      setGroups((prevGroups) =>
        prevGroups.map((group) => {
          // Find variable index in group
          const varIndex = group.variables.findIndex(
            (v) => v.name === updatedVariable.name
          );
          if (varIndex === -1) return group;

          // Create new variables array with updated variable
          const updatedVariables = [...group.variables];
          updatedVariables[varIndex] = {
            ...updatedVariables[varIndex],
            ...updatedVariable,
          };

          // Recompute dependent variables
          const varMap = new Map(updatedVariables.map((v) => [v.name, v]));

          updatedVariables.forEach((v) => {
            if (
              v.expression.includes(updatedVariable.name) &&
              v.id !== updatedVariable.id
            ) {
              try {
                let expr = v.expression;
                const varRegex = /([a-zA-Z_]\w*)/g;
                let match;

                while ((match = varRegex.exec(expr)) !== null) {
                  const depVarName = match[1];
                  const depVar = varMap.get(depVarName);
                  if (depVar) {
                    expr = expr.replace(
                      new RegExp(`\\b${depVarName}\\b`, "g"),
                      depVar.computedValue
                    );
                  }
                }

                expr = replaceMathFunctions(expr);
                v.computedValue = eval(expr);
              } catch (error) {
                console.error(`Error recomputing ${v.name}:`, error);
              }
            }
          });

          return {
            ...group,
            variables: updatedVariables,
          };
        })
      );
    });

    return () => eventSource.close();
  }, []);

  const handleDateChange = async (groupId, date) => {
    // Update local state first for immediate UI feedback
    setExecutionDates({
      ...executionDates,
      [groupId]: date,
    });

    try {
      // Find the group to get the assignId
      const group = groups.find((g) => g.groupId === groupId);
      if (!group || !group.assignId) return;

      // Send the update to the backend
      await axios.put(`${API_BASE_URL}/api/assigns/update-date`, {
        id: group.assignId,
        dateExec: date, // Format is "DD/MM/YYYY"
      });

      // Optionally update the groups state to reflect the change
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.groupId === groupId
            ? {
                ...g,
                dateExec: date.split("/").reverse().join("-") + "T00:00:00",
              }
            : g
        )
      );
    } catch (error) {
      console.error("Error updating execution date:", error);
      // Revert the local state if the update fails
      setExecutionDates({
        ...executionDates,
      });
    }
  };

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

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateString = (dateString) => {
    if (!dateString) return ""; // Handle undefined/null cases

    // Parse the date string into a Date object
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    // Format as day/month/year without leading zeros
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatRE = (reValue, creationDate) => {
    const reNumber = String(reValue || "").padStart(4, "0");
    if (!creationDate) return reNumber;

    const year = new Date(creationDate).getFullYear().toString().slice(-2);
    return `${reNumber}/${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Update a variable's value and recompute dependent variables
  const updateVariableValue = async (varName, newValue, groupIndex) => {
    // Create a deep copy of groups to avoid mutating state directly
    const updatedGroups = JSON.parse(JSON.stringify(groups));
    const updatedGroup = updatedGroups[groupIndex];

    // Find the variable being updated
    const variable = updatedGroup.variables.find((v) => v.name === varName);
    if (!variable) {
      console.warn(`Variable ${varName} not found`);
      return;
    }

    // Convert to number and validate
    const numericValue = parseFloat(newValue);
    if (isNaN(numericValue)) return;

    // Update the variable
    variable.computedValue = numericValue;

    // If it's a simple variable (just a number), update expression too
    if (/^\d*\.?\d+$/.test(variable.expression)) {
      variable.expression = numericValue.toString();
    }

    // Create a map of all variables for easy lookup
    const varMap = new Map(updatedGroup.variables.map((v) => [v.name, v]));

    // Recompute all dependent variables
    let hasUpdates = false;
    updatedGroup.variables.forEach((v) => {
      // Skip the variable we're updating
      if (v.name === varName) return;

      // Check if this variable's expression depends on the changed variable
      if (v.expression.includes(varName)) {
        try {
          // First replace all variable references
          let expr = v.expression;
          const varRegex = /([a-zA-Z_]\w*)/g;
          let match;

          while ((match = varRegex.exec(expr)) !== null) {
            const depVarName = match[1];
            const depVar = varMap.get(depVarName);
            if (depVar) {
              expr = expr.replace(
                new RegExp(`\\b${depVarName}\\b`, "g"),
                depVar.computedValue
              );
            }
          }

          // Then replace math functions and evaluate
          expr = replaceMathFunctions(expr);
          const newValue = eval(expr);

          // Only update if value changed
          if (v.computedValue !== newValue) {
            v.computedValue = newValue;
            hasUpdates = true;
          }
        } catch (error) {
          console.error(`Error recomputing ${v.name}:`, error);
        }
      }
    });

    // Only update state if something actually changed
    if (hasUpdates) {
      try {
        // Send all updates to backend
        await Promise.all(
          updatedGroup.variables.map(async (v) => {
            await axios.put(`${API_BASE_URL}/api/tests/variables/${v.id}`, {
              expression: v.expression,
              computedValue: v.computedValue,
            });
          })
        );

        // Update UI state
        setGroups(updatedGroups);
      } catch (error) {
        console.error("Error updating variables:", error);
      }
    }
  };

  const handleUserChange = async (assignId, newUserId) => {
    const selectedOperateur = operateurs.find(
      (op) => op.id === parseInt(newUserId)
    );

    if (!selectedOperateur) return;

    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.assignId === assignId) {
          return {
            ...group,
            user: `${selectedOperateur.firstName} ${selectedOperateur.lastName}`,
            userId: selectedOperateur.id,
          };
        }
        return group;
      })
    );
    try {
      await axios.put(`${API_BASE_URL}/api/assigns/update-user`, {
        id: assignId,
        userId: newUserId,
      });
    } catch (error) {
      console.error("Error updating assign user:", error);
    }
  };

  const handleRapportcreation = async (testId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/fichedessai/Rapportdessai`, {
        testId,
        ficheDessaiId: essei?.id,
      });
      alert("Rapport d'essai créé avec succès!");
    } catch (error) {
      console.error("Erreur lors de la création du rapport d'essai:", error);
      alert("Erreur lors de la création du rapport d'essai.");
    }
  };

  return (
    <div className="show-assign-container">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="content-container">
        {/* Header Table - remains the same */}
        <div className="sample-info-table">
          <table>
            <tbody>
              <tr>
                <th className="yellow-bg">code échantillon</th>
                <td>
                  {essei?.ficheDessai?.order?.echantillon?.echantillonCode ||
                    "Undefined"}
                </td>
                <th className="yellow-bg">RE</th>
                <td>
                  {formatRE(
                    essei?.raportFinalRE,
                    essei?.ficheDessai?.creationDate
                  )}
                </td>
                <th className="yellow-bg">SO</th>
                <td>{String(essei?.serviceOrderID || "").padStart(4, "0")}</td>
                <th className="yellow-bg">Date de réception</th>
                <td>{formatDateString(essei?.ficheDessai?.creationDate)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Map through groups to create multiple test cards */}
        {groups.map((group, groupIndex) => {
          // Separate elements by side
          const rightTable = group.elements.find(
            (el) => el.type === "table" && el.side === "right"
          );
          const mainElements = group.elements.filter(
            (el) => !el.side || el.side === "main"
          );

          return (
            <div className="test-card" key={group.groupId}>
              {/* Top row with left table, date, and right table */}
              <div className="top-row">
                <div className="date-section">
                  <table className="date-table">
                    <tbody>
                      <tr>
                        <td className="yellow-bg">date d'exécution</td>
                        <td>
                          <input
                            type="date"
                            value={
                              group.dateExec
                                ? group.dateExec.split("T")[0] // Takes only the date part (YYYY-MM-DD) from ISO format
                                : executionDates[group.groupId]
                                    ?.split("/")
                                    .reverse()
                                    .join("-") || ""
                            }
                            onChange={(e) => {
                              const dateParts = e.target.value.split("-");
                              const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                              handleDateChange(group.groupId, formattedDate);
                            }}
                            className="date-input"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {rightTable && (
                  <div className="side-table right">
                    <AssignTable
                      item={{
                        tableContent: rightTable.tableContent,
                        id: rightTable.id,
                      }}
                      variables={[]}
                      onUpdateValue={() => {}}
                    />
                  </div>
                )}
              </div>

              {/* Main content - other elements */}
              <div className="main-content">
                {mainElements.map((element, index) => {
                  if (!element) return null;

                  if (element.type === "elm") {
                    return (
                      <div key={`${element.id}-${index}`}>{element.text}</div>
                    );
                  } else if (element.type === "title") {
                    return (
                      <div
                        key={`${element.id}-${index}`}
                        className="title-item"
                      >
                        <p style={{ color: "#ff0000", fontWeight: "bold" }}>
                          {element.text}
                        </p>
                      </div>
                    );
                  } else if (element.type === "table") {
                    return (
                      <AssignTable
                        key={`${element.id}-${index}`}
                        item={{
                          tableContent: element.tableContent,
                          id: element.id,
                        }}
                        variables={group.variables}
                        onUpdateValue={(name, value) =>
                          updateVariableValue(name, value, groupIndex)
                        }
                      />
                    );
                  }
                  return null;
                })}
              </div>

              {/* Bottom row with operator selection and print button */}
              <div className="bottom-row">
                <div className="chargee-section">
                  <span className="yellow-bg">Chargée d'essai</span>
                  <select
                    value={group.userId || ""}
                    onChange={(e) =>
                      handleUserChange(
                        group.assignId,
                        group.userId,
                        e.target.value
                      )
                    }
                    className="operator-select"
                  >
                    <option value={group.userId || ""} hidden>
                      {group.user}
                    </option>
                    {operateurs.map((operateur) => (
                      <option key={operateur.id} value={operateur.id}>
                        {operateur.firstName} {operateur.lastName}
                      </option>
                    ))}
                  </select>
                  <button className="print-button" onClick={handlePrint}>
                    IMPRIMER FC01
                  </button>
                  <button
                    className="print-button"
                    onClick={() => handleRapportcreation(group.groupId)}
                  >
                    creer un rapport d'essai
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShowAssign;
