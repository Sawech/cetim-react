import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import SentenceItem from "./sentenceitem";
import ImageItem from "./imageitem";
import TableItem from "./tableitem";
import { replaceVariables, replaceMathFunctions } from "./variableutils";
import useTestData from "./usetestdata";
import {
  FaFont,
  FaImage,
  FaTable,
  FaInfoCircle,
  FaFileWord,
  FaSlidersH, // For variable modification
  FaSave,
  FaRegSave,
} from "react-icons/fa";

const TestCreation = ({ id, currentUser, setActiveTab, activeTab }) => {
  const [items, setItems] = useState([]);
  const [variables, setVariables] = useState([]);
  const [testName, setTestName] = useState("");
  const [testCode, setTestCode] = useState("");
  const [newVarName, setNewVarName] = useState("");
  const [newVarUnit, setNewVarUnit] = useState("");
  const [newVarMin, setNewVarMin] = useState("");
  const [newVarMax, setNewVarMax] = useState("");
  const [newSentence, setNewSentence] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSentenceModal, setShowSentenceModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTitle, setIsTitle] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  // Custom hook for test data
  const { initialItems } = useTestData(
    id,
    setItems,
    setVariables,
    setTestName,
    setTestCode
  );

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdown if click is outside both dropdown menu and button
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    // Add event listener when component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateVariable = async () => {
    if (!newVarName) {
      alert("must add variabel Name");
      return;
    }
    const updatedVariables = [...variables];
    const variable = updatedVariables.find((item) => item.name === newVarName);

    if (!variable) {
      return;
    }

    if (newVarMin || newVarMax) {
      if (
        (newVarMin && newVarMax && Number(newVarMin) > Number(newVarMax)) ||
        (newVarMin &&
          !newVarMax &&
          variable.max &&
          Number(newVarMin) > Number(variable.max)) ||
        (variable.min &&
          !newVarMin &&
          newVarMax &&
          Number(variable.min) > Number(newVarMax))
      ) {
        alert("Min > Max!");
        return;
      }
      variable.min = newVarMin || variable.min;
      variable.max = newVarMax || variable.max;
    }

    if (newVarUnit) {
      variable.unit = newVarUnit;
    }
    setVariables(updatedVariables);

    // Send update to backend
    try {
      await axios.put(
        `${API_BASE_URL}/api/tests/variables/${variable.id}`,
        variable,
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error updating element in backend:", error);
    }
    setNewVarName("");
    setNewVarMin("");
    setNewVarMax("");
    setNewVarUnit("");
  };

  // Modify the tab switching functions
  const switchToTest = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab("test");
      setIsTransitioning(false);
    }, 300); // Match this duration with your CSS transition
  };

  const switchToEssei = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab("essei");
      setIsTransitioning(false);
    }, 300);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  // Update a variable's value and recompute dependent variables
  const updateVariableValue = async (varName, newValue) => {
    // First update the state
    const updatedVariables = await new Promise((resolve) => {
      setVariables((prevVariables) => {
        const updatedVariables = [...prevVariables];
        const variable = updatedVariables.find((item) => item.name === varName);

        if (!variable) {
          console.warn(`Variable ${varName} not found`);
          return prevVariables;
        }

        if (isNaN(newValue)) {
          return prevVariables;
        }

        // Update the variable value
        variable.computedValue = parseFloat(newValue);

        // If it's an independent variable, update the expression too
        if (/^\d*\.?\d+$/.test(variable.expression)) {
          variable.expression = newValue.toString();
        }

        // Recompute dependent variables
        const finalVariables = updatedVariables.map((item) => {
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

        resolve(finalVariables); // Resolve with the updated variables
        return finalVariables;
      });
    });

    if (id !== "0") {
      try {
        const variable = updatedVariables.find((item) => item.name === varName);
        if (variable) {
          await axios.put(
            `${API_BASE_URL}/api/tests/variables/${variable.id}`,
            variable,
            { withCredentials: true }
          );
        }
      } catch (error) {
        console.error("Error updating element in backend:", error);
      }
    }
  };

  const handleWordUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/upload/test`,
        formData,
        { withCredentials: true },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Reset the specific input field
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const addSentence = (isTitle = false) => {
    if (newSentence.trim() === "") {
      alert("Sentence cannot be empty!");
      return;
    }
    setItems([
      ...items,
      {
        type: isTitle ? "title" : "sentence", // Use "title" type if isTitle is true
        text: newSentence,
        important: activeTab === "essei" ? true : false,
      },
    ]);
    setNewSentence("");
    setIsTitle(false); // Reset the title checkbox
  };

  const addImage = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/api/tests/upload-image`,
          formData,
          { withCredentials: true }
        );
        const imagePath = uploadResponse.data;

        setItems([
          ...items,
          {
            type: "image",
            text: imagePath,
            important: activeTab === "essei" ? true : false,
          },
        ]);
      } catch (error) {
        alert("Image upload failed!");
      }
    }
  };
  const handleFileUpload = (side, e) => {
    const file = e.target.files[0];

    // Check if a file was selected
    if (!file) {
      alert("No file selected!");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target.result;

        // Check if the file is empty
        if (!data || data.length === 0) {
          alert("The file is empty!");
          return;
        }

        let workbook;
        try {
          workbook = XLSX.read(data, { type: "binary" });
        } catch (error) {
          alert("The file is corrupted or not a valid Excel file");
          console.error("Error reading Excel file:", error);
          return;
        }

        // Check if workbook has sheets
        if (workbook.SheetNames.length === 0) {
          alert("The Excel file contains no sheets");
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Check if sheet is empty
        if (!sheet || !sheet["!ref"]) {
          alert("The first sheet is empty");
          return;
        }

        // Process the sheet and create table HTML
        const table = document.createElement("table");
        table.style.borderCollapse = "collapse";
        table.style.border = "1px solid black";

        const range = XLSX.utils.decode_range(sheet["!ref"]);
        const merges = sheet["!merges"] || [];

        const mergedCells = Array(range.e.r + 1)
          .fill()
          .map(() => Array(range.e.c + 1).fill(false));

        merges.forEach((merge) => {
          for (let r = merge.s.r; r <= merge.e.r; r++) {
            for (let c = merge.s.c; c <= merge.e.c; c++) {
              mergedCells[r][c] = true;
            }
          }
        });

        for (let r = range.s.r; r <= range.e.r; r++) {
          const tr = document.createElement("tr");

          for (let c = range.s.c; c <= range.e.c; c++) {
            if (mergedCells[r][c]) {
              const isMergeStart = merges.some(
                (m) => m.s.r === r && m.s.c === c
              );
              if (!isMergeStart) continue;
            }

            const td = document.createElement("td");
            td.style.border = "1px solid black";
            td.style.padding = "5px";

            const cellAddress = XLSX.utils.encode_cell({ r, c });
            const cell = sheet[cellAddress];

            if (cell && !cell.f) {
              td.textContent = cell.v;
            }

            const merge = merges.find((m) => m.s.r === r && m.s.c === c);
            if (merge) {
              td.colSpan = merge.e.c - merge.s.c + 1;
              td.rowSpan = merge.e.r - merge.s.r + 1;
            }

            tr.appendChild(td);
          }

          table.appendChild(tr);
        }

        // Check if a table with this side already exists
        const existingTableIndex = items.findIndex(
          (item) => item.type === "table" && item.side === side
        );

        if (side === "right") {
          if (existingTableIndex !== -1) {
            // Replace existing left/right table
            setItems((prevItems) =>
              prevItems.map((item, index) =>
                index === existingTableIndex
                  ? {
                      ...item,
                      tableContent: table.outerHTML,
                    }
                  : item
              )
            );
          } else {
            // Add new left/right table
            setItems((prevItems) => [
              ...prevItems,
              {
                type: "table",
                side: side,
                tableContent: table.outerHTML,
                important: activeTab === "essei" ? true : false,
              },
            ]);
          }
        } else {
          // For other sides (main), always add as new table
          setItems((prevItems) => [
            ...prevItems,
            {
              type: "table",
              side: side,
              tableContent: table.outerHTML,
              important: activeTab === "essei" ? true : false,
            },
          ]);
        }
      } catch (error) {
        alert("An error occurred while processing the file");
        console.error("File processing error:", error);
      }
    };

    reader.onerror = () => {
      alert("Error reading the file");
    };

    reader.readAsBinaryString(file);

    e.target.value = "";
  };

  const saveTest = async () => {
    const elements = items.map((item, index) => {
      const element = {
        type: item.type,
        position: item.position || index,
        important: item.important || false,
      };

      if (item.type === "table") {
        // Save table HTML as-is (with variable placeholders)
        element.tableContent = item.tableContent;
        element.side = item.side;
      } else {
        element.content = item.text || "";
      }

      return element;
    });

    if (elements.length === 0 || !testCode) {
      alert("Must add elements and fill test code!");
      return;
    }

    const testData = {
      service: currentUser.service,
      testCode: testCode,
      testName: testName,
      isPrimaryTest: true,
      complexeTest: false,
      elements: elements,
      variables: variables,
    };
    if (id === "0") {
      const isUnique = await checkTestCodeUnique(testCode);
      if (!isUnique) {
        alert("Test code must be unique!");
        return;
      }
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/tests`,
          testData,
          { withCredentials: true }
        );
        alert("Test saved successfully!");
        const newId = response.data.id;
        navigate(`/test/${newId}`);
      } catch (error) {
        console.error("Error saving test:", error);
        alert("Failed to save test.");
      }
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/tests/${id}`, testData, {
        withCredentials: true,
      });

      alert("Test saved successfully!");
    } catch (error) {
      console.error("Error saving test:", error);
      alert("Failed to save Test...");
    }
  };

  const checkTestCodeUnique = async (code) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/tests/check-code?code=${code}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking test code:", error);
      return false;
    }
  };

  const hasTable = (side) => {
    return items.some((item) => item.type === "table" && item.side === side);
  };

  // Replace the existing addVariableFromTable function with this updated version
  const addVariableFromTable = (varName, expression) => {
    setVariables((prevVariables) => {
      // Check if variable already exists
      if (prevVariables.some((item) => item.name === varName)) {
        return prevVariables;
      }

      try {
        // Check if this is an IF condition
        const ifMatch = expression.match(
          /^if\s*\((.*?)\s*,\s*(.*?)\s*,\s*(.*?)\)$/i
        );

        let substituted, value;

        if (ifMatch) {
          // Handle IF condition
          const [_, condition, trueValue, falseValue] = ifMatch;

          // Substitute variables in condition
          const substitutedCondition = replaceVariables(
            condition,
            prevVariables
          );
          if (substitutedCondition === null) {
            alert(
              `Error: One of the variables in the condition doesn't exist!`
            );
            return prevVariables;
          }

          // Evaluate condition
          const conditionResult = eval(
            replaceMathFunctions(substitutedCondition)
          );

          // Substitute variables in the appropriate branch
          const branchToEvaluate = conditionResult ? trueValue : falseValue;
          substituted = replaceVariables(branchToEvaluate, prevVariables);
        } else {
          // Regular expression
          substituted = replaceVariables(expression, prevVariables);
        }

        if (substituted === null) {
          alert(`Error: One of the variables doesn't exist!`);
          return prevVariables;
        }

        const evalExpr = replaceMathFunctions(substituted);
        value = eval(evalExpr);

        return [
          ...prevVariables,
          {
            name: varName,
            expression: expression,
            computedValue: value,
            min: "",
            max: "",
            unit: "",
          },
        ];
      } catch (error) {
        console.error("Error creating variable:", error);
        alert(`Error evaluating expression: ${error.message}`);
        return prevVariables;
      }
    });
  };
  const moveItemUp = (index) => {
    if (index <= 0) return; // Can't move first item up
    const newItems = [...items];
    // Swap with previous item
    [newItems[index], newItems[index - 1]] = [
      newItems[index - 1],
      newItems[index],
    ];
    setItems(newItems);
  };

  const moveItemDown = (index) => {
    if (index >= items.length - 1) return; // Can't move last item down
    const newItems = [...items];
    // Swap with next item
    [newItems[index], newItems[index + 1]] = [
      newItems[index + 1],
      newItems[index],
    ];
    setItems(newItems);
  };

  return (
    <>
      <div className="test-header">
        {id === "0" ? (
          <>
            {activeTab === "test" ? (
              <>
                <h2>Créer Un Test</h2>

                <div className="dropdown">
                  <button
                    ref={buttonRef}
                    className="dropdown-toggle"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    Ajouter Élément
                  </button>

                  {dropdownOpen && (
                    <div ref={dropdownRef} className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowSentenceModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaFont style={{ marginRight: "8px" }} />
                        Phrase
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = "image/*";
                          fileInput.onchange = (e) => {
                            addImage(e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaImage style={{ marginRight: "8px" }} />
                        Image
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".xlsx, .xls";
                          fileInput.onchange = (e) => {
                            handleFileUpload("main", e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaTable style={{ marginRight: "8px" }} />
                        Table
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowVariableModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaSlidersH style={{ marginRight: "8px" }} />
                        Modifier Variable
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="toggle-button"
                  onClick={switchToEssei} // Use the new function
                >
                  Créer Un Essei
                </button>
              </>
            ) : (
              <>
                <h2>Créer Un Essei</h2>

                <div className="dropdown">
                  <button
                    ref={buttonRef}
                    className="dropdown-toggle"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    Ajouter Élément
                  </button>

                  {dropdownOpen && (
                    <div ref={dropdownRef} className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowSentenceModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaFont style={{ marginRight: "8px" }} />
                        Phrase
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = "image/*";
                          fileInput.onchange = (e) => {
                            addImage(e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaImage style={{ marginRight: "8px" }} />
                        Image
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".xlsx, .xls";
                          fileInput.onchange = (e) => {
                            handleFileUpload("main", e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaTable style={{ marginRight: "8px" }} />
                        Main Table
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".xlsx, .xls";
                          fileInput.onchange = (e) => {
                            handleFileUpload("right", e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaInfoCircle style={{ marginRight: "8px" }} />
                        Info table
                        {hasTable("right") && (
                          <span className="table-notifier">✓</span>
                        )}
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".doc,.docx";
                          fileInput.onchange = (e) => {
                            handleWordUpload(e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaFileWord style={{ marginRight: "8px" }} />
                        Importer Word
                      </button>

                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowVariableModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaSlidersH style={{ marginRight: "8px" }} />
                        Modifier Variable
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="toggle-button"
                  onClick={switchToTest} // Use the new function
                >
                  Créer Un Test
                </button>
              </>
            )}
          </>
        ) : (
          // Editing mode (existing test)
          <>
            {activeTab === "test" ? (
              <>
                <h2>Modifier Le Test</h2>

                <div className="dropdown">
                  <button
                    ref={buttonRef}
                    className="dropdown-toggle"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    Ajouter Élément
                  </button>

                  {dropdownOpen && (
                    <div ref={dropdownRef} className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowSentenceModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaFont style={{ marginRight: "8px" }} />
                        Phrase
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = "image/*";
                          fileInput.onchange = (e) => {
                            addImage(e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaImage style={{ marginRight: "8px" }} />
                        Image
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".xlsx, .xls";
                          fileInput.onchange = (e) => {
                            handleFileUpload("main", e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaTable style={{ marginRight: "8px" }} />
                        Table
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowVariableModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaSlidersH style={{ marginRight: "8px" }} />
                        Modifier Variable
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="toggle-button"
                  onClick={switchToEssei} // Use the new function
                >
                  Modifier L'Essei
                </button>
              </>
            ) : (
              <>
                <h2>Modifier L'Essei</h2>

                <div className="dropdown">
                  <button
                    ref={buttonRef}
                    className="dropdown-toggle"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    Ajouter Élément
                  </button>

                  {dropdownOpen && (
                    <div ref={dropdownRef} className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowSentenceModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaFont style={{ marginRight: "8px" }} />
                        Phrase
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = "image/*";
                          fileInput.onchange = (e) => {
                            addImage(e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaImage style={{ marginRight: "8px" }} />
                        Image
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".xlsx, .xls";
                          fileInput.onchange = (e) => {
                            handleFileUpload("main", e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaTable style={{ marginRight: "8px" }} />
                        Main Table
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".xlsx, .xls";
                          fileInput.onchange = (e) => {
                            handleFileUpload("right", e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaInfoCircle style={{ marginRight: "8px" }} />
                        Info table
                        {hasTable("right") && (
                          <span className="table-notifier">✓</span>
                        )}
                      </button>

                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = ".doc,.docx";
                          fileInput.onchange = (e) => {
                            handleWordUpload(e);
                          };
                          fileInput.click();
                          setDropdownOpen(false);
                        }}
                      >
                        <FaFileWord style={{ marginRight: "8px" }} />
                        Importer Word
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowVariableModal(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <FaSlidersH style={{ marginRight: "8px" }} />
                        Modifier Variable
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="toggle-button"
                  onClick={switchToTest} // Use the new function
                >
                  Modifier Le Test
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Move these form groups outside of items-section */}
      <div className="test-info">
        <div className="test-info-child">
          <label>Code</label>
          <input
            type="text"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            placeholder="Enter Test Code"
          />
        </div>
        <div className="test-info-child">
          <label>Description</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Enter Test Description"
          />
        </div>
      </div>
      <div
        className={`test-form-container ${
          isTransitioning ? "slide-right" : ""
        }`}
      >
        <div
          className={`test-form ${
            activeTab === "test" ? "test-bg" : "essei-bg"
          }`}
        >
          <div className="items-section">
            <div className="items-list">
              {items
                .filter((item) =>
                  activeTab === "essei" ? item.important : !item.important
                )
                .map((item) => {
                  // Get the original index for proper removal/movement
                  const originalIndex = items.findIndex((i) => i === item);
                  switch (item.type) {
                    case "sentence":
                    case "title": // This handles both "sentence" and "title" cases
                      return (
                        <SentenceItem
                          key={originalIndex}
                          item={item}
                          onRemove={() => removeItem(originalIndex)}
                          onMoveUp={() => moveItemUp(originalIndex)}
                          onMoveDown={() => moveItemDown(originalIndex)}
                        />
                      );
                    case "image":
                      return (
                        <ImageItem
                          key={originalIndex}
                          item={item}
                          onRemove={() => removeItem(originalIndex)}
                          onMoveUp={() => moveItemUp(originalIndex)}
                          onMoveDown={() => moveItemDown(originalIndex)}
                        />
                      );
                    case "table":
                      if (item.side === "main" || item.side === "right") {
                        return (
                          <TableItem
                            key={originalIndex}
                            index={originalIndex}
                            item={item}
                            variables={variables}
                            onRemove={() => removeItem(originalIndex)}
                            onUpdate={(newContent) => {
                              setItems((prevItems) =>
                                prevItems.map((item, idx) =>
                                  idx === originalIndex
                                    ? { ...item, tableContent: newContent }
                                    : item
                                )
                              );
                            }}
                            onCreateVariable={(name, expr) =>
                              addVariableFromTable(name, expr)
                            }
                            onUpdateValue={(name, value) =>
                              updateVariableValue(name, value)
                            }
                            onMoveUp={() => moveItemUp(originalIndex)}
                            onMoveDown={() => moveItemDown(originalIndex)}
                          />
                        );
                      }
                      return null;
                    default:
                      return null;
                  }
                })}
            </div>
          </div>
        </div>
      </div>
      {/* Sentence Modal */}
      {showSentenceModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Ajouter une phrase</h3>
              <button
                className="modal-close"
                onClick={() => setShowSentenceModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={isTitle}
                    onChange={() => setIsTitle(!isTitle)}
                    style={{ width: "20px", marginBottom: "15px" }}
                  />
                  Bold
                </label>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={newSentence}
                  onChange={(e) => setNewSentence(e.target.value)}
                  placeholder="Entrez votre texte ici"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowSentenceModal(false)}
              >
                Annuler
              </button>
              <button
                className="create-button"
                onClick={() => {
                  addSentence(isTitle);
                  setShowSentenceModal(false);
                }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Variable Modal */}
      {showVariableModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Modifier une variable</h3>
              <button
                className="modal-close"
                onClick={() => setShowVariableModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom de la variable</label>
                <input
                  type="text"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="Entrez le nom de la variable"
                />
              </div>
              <div className="form-group row">
                <div className="col">
                  <label>Min</label>
                  <input
                    type="number"
                    value={newVarMin}
                    onChange={(e) => setNewVarMin(e.target.value)}
                    placeholder="Valeur min"
                  />
                </div>
                <div className="col">
                  <label>Max</label>
                  <input
                    type="number"
                    value={newVarMax}
                    onChange={(e) => setNewVarMax(e.target.value)}
                    placeholder="Valeur max"
                  />
                </div>
                <div className="col">
                  <label>Unité</label>
                  <input
                    type="text"
                    value={newVarUnit}
                    onChange={(e) => setNewVarUnit(e.target.value)}
                    placeholder="g, m, m/s..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowVariableModal(false)}
              >
                Annuler
              </button>
              <button
                className="create-button"
                onClick={() => {
                  updateVariable();
                  setShowVariableModal(false);
                }}
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Save Button */}
      <div className="save-button-container">
        {id === "0" ? (
          <button className="save-button" onClick={saveTest}>
            <FaRegSave style={{ marginRight: "8px" }} />
            Save
          </button>
        ) : (
          <button className="save-button" onClick={saveTest}>
            <FaSave style={{ marginRight: "8px" }} />
            "Update"
          </button>
        )}
      </div>
    </>
  );
};

export default TestCreation;
