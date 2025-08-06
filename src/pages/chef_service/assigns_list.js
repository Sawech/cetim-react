import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import Sidebar from "../commun/sidebare.js";
import AuthService from "../../services/login_service.js";
import "../../styles/userstable.css";

const AssignsList = () => {
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

  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, esseisRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/assigns`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE_URL}/api/fichedessai`, {
            withCredentials: true,
          }),
        ]);

        // Create maps for quick lookup
        const esseiMap = new Map(
          esseisRes.data.map((essei) => [essei.id, essei])
        );

        // Process assignments with enriched data
        const processedAssigns = assignRes.data
          .filter((assign) => assign.service === currentuser.service)
          .map((assign) => {
            const essei = esseiMap.get(assign.ficheDessaiId);
            return {
              ...assign,
              esseiId: essei?.id || "No Fiche", // Changed from essei?.ficheDessai.id
              echantillonID:
                essei?.order.echantillon.echantillonCode || "No Echantillon", // Changed from essei?.ficheDessai.order.echantillonID
            };
          })
          .reduce((acc, current) => {
            const exists = acc.some(
              (item) => item.assignNumber === current.assignNumber
            );
            if (!exists) {
              acc.push(current);
            }
            return acc;
          }, [])
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

  const handleRowClick = (assignId) => {
    setSelectedAssignId(assignId);
  };

  // Handle option selection
  const handleShowAssign = (assignNumber) => {
    navigate(`/show-assign/${assignNumber}`);
    setSelectedAssignId(null);
  };

  const handleDeleteAssign = async (assignId) => {
    if (window.confirm("Are you sure you want to delete this assign?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/assigns/${assignId}`, {
          withCredentials: true,
        });
        setAssigns(assigns.filter((assign) => assign.id !== assignId)); // Update the local state
        alert("Assign deleted successfully!");
      } catch (err) {
        console.error("Error deleting assign:", err);
        alert("Failed to delete assign. Please try again.");
      }
    }
  };

  const filteredAssigns = assigns.filter((assign) => {
    const assignNumber = assign.assignNumber.toString() || "Undefined";
    const esseiId = assign.esseiId.toString() || "Undefined";
    const echantillonID = assign.echantillonID || "Undefined";

    return (
      assignNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      esseiId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      echantillonID.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Display loading or error messages
  if (loading) {
    return <div className="loading">Chargement des assignments...</div>;
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
            <h1>Gestion des Assignments</h1>
            <button
              className="add-user-btn"
              onClick={() => navigate("/assign/0")}
            >
              Ajouter un Assignment
            </button>
          </div>

          <div className="users-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Rechercher des assignments..."
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
              <p>Aucun Assignment trouvé.</p>
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
                      <th onClick={() => requestSort("esseiId")}>
                        ficheDessaiId{getSortArrow("esseiId")}
                      </th>
                      <th onClick={() => requestSort("echantillonID")}>
                        Echantillon{getSortArrow("echantillonID")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAssigns.map((assign) => (
                      <React.Fragment key={assign.id}>
                        <tr onClick={() => handleRowClick(assign.id)}>
                          <td>{assign.assignNumber}</td>
                          <td>{assign.esseiId}</td>
                          <td>{assign.echantillonID}</td>
                        </tr>
                        {selectedAssignId === assign.id && (
                          <tr className="options-row">
                            <td colSpan="7">
                              <div className="options-container">
                                <button
                                  className="option-btn profile-btn"
                                  onClick={() =>
                                    handleShowAssign(assign.assignNumber)
                                  }
                                >
                                  Voir l'Assignment
                                </button>
                                <button
                                  className="option-btn"
                                  onClick={() => handleDeleteAssign(assign.id)}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
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

export default AssignsList;
