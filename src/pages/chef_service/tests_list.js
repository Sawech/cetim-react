import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import Sidebar from '../commun/sidebare.js';
import AuthService from '../../services/login_service.js';
import '../../styles/userstable.css';

const TestsList = () => {

  /**
   * 
   * 
   */
  const navigate = useNavigate();
  const currentuser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentuser) {
      navigate('/login');
    }
  }, [navigate, currentuser]);





  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [testsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tests`, {
          withCredentials: true,
        });
        setTests(response.data.filter(test => test.isPrimaryTest === true));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleRowClick = (testId) => {
    setSelectedTestId(testId);
  };

  // Handle option selection
  const handleOptionSelect = (option, testId) => {
    if (option === 'details') {
      navigate(`/test/${testId}`);
    } else if (option === 'delete') {
      handleDeleteTest(testId);
    }
    setSelectedTestId(null); 
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/tests/${testId}`, {
          withCredentials: true,
        });
        setTests(tests.filter(test => test.id !== testId)); // Update the local state
        alert('Test deleted successfully!');
      } catch (err) {
        console.error('Error deleting test:', err);
        alert('Failed to delete test. Please try again.');
      }
    }
  };

  const filteredTests = tests.filter(test => {
    const id = test.id.toString() || 'Undefined';
    const testCode = test.testCode || 'Undefined';
  const testName = test.testName || 'Undefined';

  return (
    id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testName.toLowerCase().includes(searchTerm.toLowerCase())
  );
});

  // Sort tests
  const sortedTests = React.useMemo(() => {
    let sortableTests = [...filteredTests];
    if (sortConfig.key) {
      sortableTests.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTests;
  }, [filteredTests, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Pagination
  const indexOfLastTest = currentPage * testsPerPage;
  const indexOfFirstTest = indexOfLastTest - testsPerPage;
  const currentTests = sortedTests.slice(indexOfFirstTest, indexOfLastTest);
  const totalPages = Math.ceil(sortedTests.length / testsPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get sort arrow
  const getSortArrow = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    }
    return '';
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
            <h1>Gestion des Tests</h1>
            <Link to="/test/0" className="add-user-btn">
              <span className="btn-icon">+</span> Ajouter un test
            </Link>
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

          {tests.length === 0 ? (
            <div className="no-users">
              <p>Aucun Test trouvé. Cliquez sur le bouton "Ajouter un Test" pour en créer un.</p>
            </div>
          ) : (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th onClick={() => requestSort('id')}>
                        ID{getSortArrow('id')}
                      </th>
                      <th onClick={() => requestSort('testCode')}>
                        Code{getSortArrow('testCode')}
                      </th>
                      <th onClick={() => requestSort('testName')}>
                        Details{getSortArrow('testName')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTests.map((test) => (
                      <React.Fragment key={test.id}>
                        <tr onClick={() => handleRowClick(test.id)}>
                          <td>{test.id}</td>
                          <td>{test.testCode}</td>
                          <td>{test.testName}</td>
                        </tr>
                        {selectedTestId === test.id && (
                          <tr className="options-row">
                            <td colSpan="7">
                              <div className="options-container">
                                <button
                                  className="option-btn profile-btn"
                                  onClick={() => handleOptionSelect('details', test.id)}
                                >
                                  Voir le Test
                                </button>
                                <button
                                  className="option-btn"
                                  onClick={() => handleOptionSelect('delete', test.id)}
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

export default TestsList;