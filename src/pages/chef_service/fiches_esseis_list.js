import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import Sidebar from "../commun/sidebare.js";
import AuthService from "../../services/login_service.js";
import "../../styles/userstable.css";

const FichesDesseisList = () => {
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

  const [fiches, setFiches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [fichesPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFicheId, setSelectedFicheId] = useState(null);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    const fetchFiches = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/fichedessai`,
          {
            withCredentials: true,
          }
        );
        
        setFiches(
          response.data.filter((fiche) => 
            fiche.order.tests.some(test => test.service === currentuser.service)
          )
        );
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFiches();
  }, []);

  const handleRowClick = (ficheId) => {
    setSelectedFicheId(ficheId);
  };

  // Handle option selection
  const handleOptionSelect = (option, ficheId) => {
    if (option === "details") {
      navigate(`/assign/${ficheId}`);
    } else if (option === "delete") {
      handleDeleteFiche(ficheId);
    }
    setSelectedFicheId(null);
  };

  const handleDeleteFiche = async (ficheId) => {
    if (window.confirm("Are you sure you want to delete?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/fichedessai/${ficheId}`, {
          withCredentials: true,
        });
        setFiches(fiches.filter((fiche) => fiche.id !== ficheId)); // Update the local state
        alert("Deleted successfully!");
      } catch (err) {
        console.error("Error deleting :", err);
        alert("Failed to delete. Please try again.");
      }
    }
  };

  const filteredFiches = fiches.filter((fiche) => {
    const id = fiche.id.toString() || "Undefined";
    const echantillonID = fiche.order.echantillon.echantillonCode || "Undefined";
    const delai = fiche.order.delai || "Undefined";

    return (
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      echantillonID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delai.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort fiches
  const sortedFiches = React.useMemo(() => {
    let sortableFiches = [...filteredFiches];
    if (sortConfig.key) {
      sortableFiches.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableFiches;
  }, [filteredFiches, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Pagination
  const indexOfLastFiche = currentPage * fichesPerPage;
  const indexOfFirstFiche = indexOfLastFiche - fichesPerPage;
  const currentFiches = sortedFiches.slice(indexOfFirstFiche, indexOfLastFiche);
  const totalPages = Math.ceil(sortedFiches.length / fichesPerPage);

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
    return <div className="loading">Chargement...</div>;
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
            <h1>Gestion des Fiches</h1>
          </div>

          <div className="users-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Rechercher des fiches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-container">
              {/* Des filtres supplémentaires peuvent être ajoutés ici */}
            </div>
          </div>

          {fiches.length === 0 ? (
            <div className="no-users">
              <p>Aucun Fiche d'Essei trouvé.</p>
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
                      <th onClick={() => requestSort("echantillonID")}>
                        Echantillon ID{getSortArrow("echantillonID")}
                      </th>
                      <th onClick={() => requestSort("delai")}>
                        Delai{getSortArrow("delai")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFiches.map((fiche) => (
                      <React.Fragment key={fiche.id}>
                        <tr onClick={() => handleRowClick(fiche.id)}>
                          <td>{fiche.id}</td>
                          <td>{fiche.order.echantillon.echantillonCode}</td>
                          <td>{fiche.order.delai}</td>
                        </tr>
                        {selectedFicheId === fiche.id && (
                          <tr className="options-row">
                            <td colSpan="7">
                              <div className="options-container">
                                <button
                                  className="option-btn profile-btn"
                                  onClick={() =>
                                    handleOptionSelect("details", fiche.id)
                                  }
                                >
                                  Assigner
                                </button>
                                <button
                                  className="option-btn"
                                  onClick={() =>
                                    handleOptionSelect("delete", fiche.id)
                                  }
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

export default FichesDesseisList;
