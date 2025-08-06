import React, { useState, useEffect } from "react";
import axios from "axios";
import AuthService from "../../services/login_service";
import Sidebar from '../commun/sidebare';
import "../../styles/userstable.css";

const OperateurHistorique = () => {
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedVariableId, setSelectedVariableId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
        const [assignRes, testsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/assigns`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/tests`),
        ]);
        
        // Create a map of testId to assignNumber
        const assignMap = {};
        assignRes.data
          .filter(assign => assign.service === currentUser.service)
          .forEach(assign => {
            assignMap[assign.testId] = assign.assignNumber;
          });

        // Process all elements from assigned tests
        const allVariables = testsRes.data
          .filter(test => assignMap.hasOwnProperty(test.id))
          .flatMap(test => 
            (test.variables || []).map(variable => ({
              ...variable,
              testCode: test.testCode,
              assignNumber: assignMap[test.id] || 'N/A',
              createdAt: new Date(variable.createdAt),
              formattedDate: new Date(variable.createdAt).toLocaleString()
            }))
          );

        setVariables(allVariables);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sort variables
  const sortedVariables = React.useMemo(() => {
    let sortableVariables = [...variables];
    if (sortConfig.key) {
      sortableVariables.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVariables;
  }, [variables, sortConfig]);

  // Filter variables based on search input
  const filteredVariables = sortedVariables.filter(variable => 
    variable.testCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.assignNumber.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVariables.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVariables.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleRowClick = (variableId) => {
    setSelectedVariableId(variableId === selectedVariableId ? null : variableId);
  };

  // Get sort arrow
  const getSortArrow = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    }
    return '';
  };

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar roles={currentUser ? currentUser.roles : []} />
        <div className="content-area">
          <div className="loading">Loading variables history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="content-area">
        <div className="users-container">
          <div className="users-header">
            <h1>Variable Elements History</h1>
          </div>

          <div className="users-controls">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search by assign number, test code or variable name..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
          </div>

          {filteredVariables.length === 0 ? (
            <div className="no-users">
              <p>No variable elements found.</p>
            </div>
          ) : (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th onClick={() => requestSort('assignNumber')}>
                        Assign ID {getSortArrow('assignNumber')}
                      </th>
                      <th onClick={() => requestSort('testCode')}>
                        Test Code {getSortArrow('testCode')}
                      </th>
                      <th onClick={() => requestSort('name')}>
                        Variable Name {getSortArrow('name')}
                      </th>
                      <th onClick={() => requestSort('createdAt')}>
                        Modified Date {getSortArrow('createdAt')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((variable) => (
                      <React.Fragment key={`${variable.testCode}-${variable.name}-${variable.createdAt}`}>
                        <tr onClick={() => handleRowClick(variable.id)}>
                          <td>{variable.assignNumber}</td>
                          <td>{variable.testCode}</td>
                          <td>{variable.name}</td>
                          <td>{variable.formattedDate}</td>
                        </tr>
                        {selectedVariableId === variable.id && (
                          <tr className="options-row">
                            <td colSpan="4">
                              <div className="options-container">
                                <button className="option-btn profile-btn">
                                  View Details
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
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
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

export default OperateurHistorique;