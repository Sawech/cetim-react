import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AuthService from "../../services/login_service";
import Sidebar from "../commun/sidebare";
import "../../styles/assign.css";

const Assign = () => {
  const { esseiId } = useParams();
  const [tests, setTests] = useState([]);
  const [operateurs, setOperateurs] = useState([]);
  const currentUser = AuthService.getCurrentUser();
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
  const [dropdownSets, setDropdownSets] = useState([
    {
      id: 1,
      service: currentUser?.service || null,
      testCode: "",
      operateur: null,
      testSearchQuery: "",
      operateurSearchQuery: "",
      isTestDropdownOpen: false,
      isOperateurDropdownOpen: false,
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, operateursRes, esseiRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/tests`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/users/role/operateur`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE_URL}/api/fichedessai/details/${esseiId}`, {
            withCredentials: true,
          }),
        ]);
        console.log("testres : " + testsRes.data);
        const uniqueTests = testsRes.data.filter(
          (test) => test.isPrimaryTest === true
        );
        console.log("uniqueTests : " + uniqueTests);
        setTests(uniqueTests);
        setOperateurs(
          operateursRes.data.filter(
            (operateur) => operateur.service === currentUser.service
          )
        );
        if (esseiRes) {
          if (esseiRes.data.order.tests?.length > 0) {
            const allTests = esseiRes.data.order.tests.map(
              (test, testIndex) => ({
                id: testIndex,
                service: currentUser?.service || null,
                testCode: test.testCode,
                operateur: null,
                testSearchQuery: "",
                operateurSearchQuery: "",
                isTestDropdownOpen: false,
                isOperateurDropdownOpen: false,
              })
            );
            setDropdownSets(
              allTests.length > 0
                ? allTests
                : [
                    {
                      id: 1,
                      service: currentUser?.service || null,
                      testCode: "",
                      operateur: null,
                      testSearchQuery: "",
                      operateurSearchQuery: "",
                      isTestDropdownOpen: false,
                      isOperateurDropdownOpen: false,
                    },
                  ]
            );
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [esseiId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownSets((prev) =>
        prev.map((set) => ({
          ...set,
          isTestDropdownOpen: false,
          isOperateurDropdownOpen: false,
        }))
      );
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropdown = (setId, dropdownType) => (e) => {
    e.stopPropagation();
    setDropdownSets((prev) =>
      prev.map((set) => {
        if (set.id !== setId) return set;

        return {
          ...set,
          isTestDropdownOpen:
            dropdownType === "test" ? !set.isTestDropdownOpen : false,
          isOperateurDropdownOpen:
            dropdownType === "operateur" ? !set.isOperateurDropdownOpen : false,
          [`${dropdownType}SearchQuery`]: "",
        };
      })
    );
  };

  const handleAssignAll = async () => {
    if (!currentUser) {
      alert("User not logged in!");
      return;
    }

    // Validate all sets before processing
    const invalidSets = dropdownSets.filter(
      (set) => !set.testCode || !set.operateur
    );

    if (invalidSets.length > 0) {
      alert("All sets must have both test and operateur selected!");
      return;
    }

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
      const response = await axios.get(`${API_BASE_URL}/api/assigns`, {
        withCredentials: true,
      });

      // Get the array of existing assignments from the response data
      const existingAssignments = response.data;

      // Find the highest assignNumber
      const lastAssignNumber =
        existingAssignments.length > 0
          ? Math.max(...existingAssignments.map((a) => a.assignNumber))
          : 1;

      // Process all sets
      await Promise.all(
        dropdownSets.map(async (set) => {
          // Get all tests to find the matching one
          const testsResponse = await axios.get(`${API_BASE_URL}/api/tests`, {
            withCredentials: true,
          });
          const testData = testsResponse.data.find(
            (test) =>
              test.testCode === set.testCode && test.isPrimaryTest === true
          );

          if (!testData) {
            console.error("Test not found");
            return;
          }

          // Function to prepare elements
          const prepareElements = (elements) => {
            return (
              elements
                ?.sort((a, b) => a.position - b.position)
                ?.map((element) => ({
                  type: element.type,
                  content: element.content,
                  tableContent: element.tableContent,
                  side: element.side,
                  position: element.position,
                  important: element.important,
                  id: null,
                }))
                ?.filter(Boolean) || []
            );
          };

          const prepareVariables = (variables) => {
            return (
              variables
                ?.map((variable) => ({
                  name: variable.name,
                  expression: variable.expression,
                  computedValue: variable.computedValue,
                  min: variable.min,
                  max: variable.max,
                  unit: variable.unit,
                  id: null,
                }))
                ?.filter(Boolean) || []
            );
          };
          let newTestId;

          if (testData.complexeTest) {
            // 1. First create all sub-tests
            const subTestPromises =
              testData.subTestIds?.map(async (id) => {
                const subTestResponse = await axios.get(
                  `${API_BASE_URL}/api/tests/${id}`,
                  { withCredentials: true }
                );
                const subTestData = subTestResponse.data;

                const newSubTest = await axios.post(
                  `${API_BASE_URL}/api/tests`,
                  { withCredentials: true },
                  {
                    service: currentUser.service,
                    testCode: subTestData.testCode,
                    testName: subTestData.testName,
                    isPrimaryTest: false,
                    complexeTest: false,
                    subTestIds: [],
                    elements: prepareElements(subTestData.elements),
                    variables: prepareVariables(subTestData.variables),
                  }
                );

                return newSubTest.data.id;
              }) || [];

            // Wait for all sub-tests to be created
            const subTestIds = await Promise.all(subTestPromises);

            // 2. Then create the complex test with the new sub-test IDs
            const complexTestResponse = await axios.post(
              `${API_BASE_URL}/api/tests`,
              { withCredentials: true },
              {
                service: currentUser.service,
                testCode: testData.testCode,
                testName: testData.testName,
                isPrimaryTest: false,
                complexeTest: true,
                subTestIds: subTestIds,
                elements: null,
                variables: null,
              }
            );

            newTestId = complexTestResponse.data.id;
          } else {
            // Simple test case
            const simpleTestResponse = await axios.post(
              `${API_BASE_URL}/api/tests`,
              { withCredentials: true },
              {
                service: currentUser.service,
                testCode: testData.testCode,
                testName: testData.testName,
                isPrimaryTest: false,
                complexeTest: false,
                subTestIds: [],
                elements: prepareElements(testData.elements),
                variables: prepareVariables(testData.variables),
              }
            );

            newTestId = simpleTestResponse.data.id;
          }

          // Create assignment with the new test ID
          return axios.post(
            `${API_BASE_URL}/api/assigns`,
            { withCredentials: true },
            {
              service: currentUser.service,
              esseiId,
              ficheDessaiId: esseiId,
              userId: set.operateur.id.toString(),
              testId: newTestId,
              assignNumber: lastAssignNumber + 1,
            },
            { withCredentials: true }
          );
        })
      );

      // If all assignments succeeded
      alert("All assignments completed successfully!");

      // Reset the form
      setDropdownSets([
        {
          id: 1,
          service: currentUser?.service || null,
          testCode: "",
          operateur: null,
          testSearchQuery: "",
          operateurSearchQuery: "",
          isTestDropdownOpen: false,
          isOperateurDropdownOpen: false,
        },
      ]);
    } catch (error) {
      console.error(
        "Assignment failed:",
        error.response?.data || error.message
      );
      alert(
        `Assignment failed: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const handleSelect = (setId, type, value) => {
    setDropdownSets((prev) =>
      prev.map((set) => {
        if (set.id !== setId) return set;
        const updatedSet = {
          ...set,
          [`is${
            type.charAt(0).toUpperCase() + type.slice(1)
          }DropdownOpen`]: false,
        };

        if (type === "test") {
          updatedSet.testCode = value;
        } else if (type === "operateur") {
          updatedSet.operateur = value;
        }

        return updatedSet;
      })
    );
  };

  const handleSearchChange = (setId, type, e) => {
    setDropdownSets((prev) =>
      prev.map((set) => {
        if (set.id !== setId) return set;
        return { ...set, [`${type}SearchQuery`]: e.target.value };
      })
    );
  };

  const addDropdownSet = () => {
    setDropdownSets((prev) => [
      ...prev,
      {
        id: Date.now(),
        service: currentUser?.service || null,
        testCode: "",
        operateur: null,
        testSearchQuery: "",
        operateurSearchQuery: "",
        isTestDropdownOpen: false,
        isOperateurDropdownOpen: false,
      },
    ]);
  };

  const removeDropdownSet = (id) => {
    if (dropdownSets.length <= 1) return;
    setDropdownSets((prev) => prev.filter((set) => set.id !== id));
  };

  const filterTests = (query) =>
    tests.filter((p) => p.testCode.toLowerCase().includes(query.toLowerCase()));
  const filterOperateurs = (query) =>
    operateurs.filter(
      (o) =>
        `${o.firstName || ""} ${o.lastName || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        o.username.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="assign-container">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="assign-content">
        <div className="assign-header">
          <h1>Assign Operateur</h1>
        </div>

        <div className="assign-actions">
          <button className="add-set-btn" onClick={addDropdownSet}>
            Add Another Set
          </button>

          <button className="dispatch-btn" onClick={handleAssignAll}>
            Dispatch
          </button>
        </div>

        {dropdownSets.map((set) => (
          <div className="set-container" key={set.id}>
            <div className="set-header">
              <h3>Set {dropdownSets.findIndex((s) => s.id === set.id) + 1}</h3>
              {dropdownSets.length > 1 && (
                <button
                  className="remove-set-btn"
                  onClick={() => removeDropdownSet(set.id)}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Test Dropdown */}
            <div className="dropdown-section">
              <h4>Select Test</h4>
              <div className="dropdown-container">
                <button
                  className="dropdown-button"
                  onClick={toggleDropdown(set.id, "test")}
                >
                  {set.testCode
                    ? `Test Code: ${set.testCode}`
                    : "Select Test Code"}
                </button>
                {set.isTestDropdownOpen && (
                  <div className="dropdown-menu">
                    <input
                      className="dropdown-search"
                      type="text"
                      placeholder="Search tests..."
                      value={set.testSearchQuery}
                      onChange={(e) => handleSearchChange(set.id, "test", e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="dropdown-options">
                      {filterTests(set.testSearchQuery).map((test) => (
                        <div
                          className="dropdown-item"
                          key={test.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(set.id, "test", test.testCode);
                          }}
                        >
                          {test.testCode}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Operateur Dropdown */}
            <div className="dropdown-section">
              <h4>Select Operateur</h4>
              <div className="dropdown-container">
                <button
                  className="dropdown-button"
                  onClick={toggleDropdown(set.id, "operateur")}
                >
                  {set.operateur
                    ? `${set.operateur.firstName} ${set.operateur.lastName}`
                    : "Select Operateur"}
                </button>
                {set.isOperateurDropdownOpen && (
                  <div className="dropdown-menu">
                    <input
                      className="dropdown-search"
                      type="text"
                      placeholder="Search operateurs..."
                      value={set.operateurSearchQuery}
                      onChange={(e) =>
                        handleSearchChange(set.id, "operateur", e)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="dropdown-options">
                      {filterOperateurs(set.operateurSearchQuery).map((op) => (
                        <div
                          className="dropdown-item"
                          key={op.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(set.id, "operateur", op);
                          }}
                        >
                          {op.firstName} {op.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Assign;
