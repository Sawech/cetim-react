import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import Sidebar from "../commun/sidebare.js";
import AuthService from "../../services/login_service.js";
import "../../styles/userstable.css";

const AssignedList = () => {
  /**
   *
   *
   */
  const navigate = useNavigate();
  const currentuser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentuser) {
      navigate("/login");
    }
  }, [navigate, currentuser]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [assignsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigns, setAssigns] = useState([]);
  const [selectedAssignId, setSelectedAssignId] = useState(null);
  const [expandedComplexTests, setExpandedComplexTests] = useState([]);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, testsRes, fichesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/assigns`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE_URL}/api/tests`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE_URL}/api/fichedessai`, {
            withCredentials: true,
          }),
        ]);

        // Create a complete map of all tests
        const testMap = new Map(testsRes.data.map((test) => [test.id, test]));

        const ficheMap = new Map(
          fichesRes.data.map((fiche) => [fiche.id, fiche])
        );

        // Process assignments
        const processedAssigns = assignRes.data
          .filter((assign) => assign.userId === currentuser.id)
          .map((assign) => {
            const test = testMap.get(assign.testId);
            const fiche = ficheMap.get(assign.ficheDessaiId);

            // Get sub-tests for complex tests
            const subTests =
              test?.complexeTest && test.subTestIds
                ? test.subTestIds
                    .map((id) => {
                      const subTest = testMap.get(id);
                      if (!subTest) {
                        console.warn(`Missing sub-test with ID: ${id}`);
                      }
                      return subTest;
                    })
                    .filter(Boolean) // Remove undefined sub-tests
                : [];

            return {
              ...assign,
              codeEchantillon:
                fiche?.order?.echantillon.echantillonType.name || "Unknown",
              testCode: test?.testCode || "Unknown",
              testName: test?.testName || "No Details",
              complexeTest: test?.complexeTest || false,
              subTestIds: test?.subTestIds || [],
              subTests: subTests,
            };
          })
          .sort((a, b) => b.id - a.id);

        setAssigns(processedAssigns);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = (assign) => {
    if (assign.complexeTest) {
      toggleComplexTest(assign.id);
    } else {
      handleShowTest(assign.id,assign.testId);
    }
  };

  // Handle option selection
  const handleShowTest = (assignId, testId) => {
    axios
      .put(`${API_BASE_URL}/api/assigns/read/${assignId}`)
      .catch((error) => {
        console.error("Error marking as read:", error);
      });
    navigate(`/operateur/assigned/${assignId}/${testId}`);
    setSelectedAssignId(null);
  };

  const filteredAssigns = assigns.filter((assign) => {
    const assignId = assign.id.toString() || "Undefined";
    const codeEchantillon = assign.codeEchantillon || "Undefined";
    const testCode = assign.testCode || "Undefined";
    const testName = assign.testName || "Undefined";
    const complexeTest = assign.complexeTest
      ? "Complexe"
      : "Single" || "Undefined";

    return (
      assignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codeEchantillon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complexeTest.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort tests
  const sortedAssigns = React.useMemo(() => {
    let sortableAssigns = [...filteredAssigns];
    if (sortConfig.key) {
      sortableAssigns.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableAssigns;
  }, [filteredAssigns, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Pagination
  const indexOfLastAssign = currentPage * assignsPerPage;
  const indexOfFirstAssign = indexOfLastAssign - assignsPerPage;
  const currentAssigns = sortedAssigns.slice(
    indexOfFirstAssign,
    indexOfLastAssign
  );
  const totalPages = Math.ceil(sortedAssigns.length / assignsPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get sort arrow
  const getSortArrow = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ↑" : " ↓";
    }
    return "";
  };

  const toggleComplexTest = (assignId) => {
    setExpandedComplexTests((prev) => {
      const newState = prev.includes(assignId)
        ? prev.filter((id) => id !== assignId)
        : [...prev, assignId];
      return newState;
    });
    setSelectedAssignId(null);
  };

  // Display loading or error messages
  if (loading) {
    return <div className="loading">Chargement des tests...</div>;
  }

  if (error) {
    return <div className="error">Erreur : {error}</div>;
  }

  return (
    <div className="app-container">
      <Sidebar roles={currentuser ? currentuser.roles : []} />
      <div className="content-area">
        <div className="users-container">
          <div className="users-header">
            <h1>Tests</h1>
          </div>

          <div className="users-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Rechercher des tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-container">
              {/* Des filtres supplémentaires peuvent être ajoutés ici */}
            </div>
          </div>

          {assigns.length === 0 ? (
            <div className="no-users">
              <p>Aucun Test trouvé.</p>
            </div>
          ) : (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th onClick={() => requestSort("id")}>
                        ID{getSortArrow("id")}
                      </th>
                      <th onClick={() => requestSort("codeEchantillon")}>
                        Echantillon{getSortArrow("codeEchantillon")}
                      </th>
                      <th onClick={() => requestSort("testCode")}>
                        Test Code{getSortArrow("testCode")}
                      </th>
                      <th onClick={() => requestSort("testName")}>
                        Details{getSortArrow("testName")}
                      </th>
                      <th onClick={() => requestSort("complexeTest")}>
                        Type{getSortArrow("complexeTest")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAssigns.map((assign) => (
                      <React.Fragment key={assign.id}>
                        <tr
                          onClick={() => handleRowClick(assign)}
                          className={!assign.read ? "unread-row" : ""}
                        >
                          <td>{assign.id}</td>
                          <td>{assign.codeEchantillon}</td>
                          <td>{assign.testCode}</td>
                          <td>{assign.testName}</td>
                          <td>{assign.complexeTest ? "Complexe" : "Single"}</td>
                        </tr>

                        {/* For complex tests */}
                        {expandedComplexTests.includes(assign.id) &&
                          assign.subTests.map((subTest) => (
                            <React.Fragment key={`sub-${subTest.id}`}>
                              <tr
                                className="subtest-row clickable-row"
                                onClick={() => handleShowTest(assign.id,subTest.id)}
                              >
                                <td></td>
                                <td></td>
                                <td>{subTest.testCode}</td>
                                <td>{subTest.testName || "No Details"}</td>
                                <td>Sub-Test</td>
                              </tr>
                            </React.Fragment>
                          ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    &laquo;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`page-btn ${
                        currentPage === i + 1 ? "active" : ""
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="page-btn"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedList;
