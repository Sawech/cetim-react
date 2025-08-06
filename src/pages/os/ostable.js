import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../../services/login_service';
import Sidebar from '../commun/sidebare';
import '../../styles/ostable.css';

const OSTable = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [osList, setOSList] = useState([]);
  const [filteredOSList, setFilteredOSList] = useState([]); // For filtered results
  const [searchQuery, setSearchQuery] = useState(''); // Search query
  const [statusFilter, setStatusFilter] = useState(''); // Status filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedOSId, setSelectedOSId] = useState(null);
  
  // Add these after other useState declarations
  const [sortField, setSortField] = useState(null);
  const [sortSousDirection, setSortSousDirection] = useState('asc');

  // Add these after other useState declarations
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    let isMounted = true;

    const fetchOS = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/service/os`, {
          withCredentials: true
        });

        if (!isMounted) return;

        if (response.data) {
          setOSList(response.data);
          setFilteredOSList(response.data); // Initialize filtered list
        } else {
          setError('Aucune donnée OS disponible');
        }
      } catch (err) {
        if (!isMounted) return;

        console.error('Erreur lors de la récupération des OS:', err);
        if (err.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
          navigate('/login');
        } else {
          setError(err.response?.data || 'Échec de la récupération de la liste des OS');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOS();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array since we only want to fetch once when component mounts

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterList(query, statusFilter);
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    filterList(searchQuery, status);
  };

  const filterList = (query, status) => {
    const filtered = osList.filter((os) => {
      // Convert query to lowercase and trim whitespace
      const searchTerm = query.trim().toLowerCase();
      
      // Check each field, converting to string and handling null/undefined values
      const osIdMatch = os.osid ? String(os.osid).toLowerCase().includes(searchTerm) : false;
      const reMatch = os.raportFinalRE ? String(os.raportFinalRE).toLowerCase().includes(searchTerm) : false;
      const statusMatch = os.status ? os.status.toLowerCase().includes(searchTerm) : false;
      
      // Combine all search conditions
      const matchesQuery = searchTerm === '' || osIdMatch || reMatch || statusMatch;
      
      // Check status filter
      const matchesStatus = !status || os.status === status;

      return matchesQuery && matchesStatus;
    });

    setFilteredOSList(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewDetails = (id) => {
    navigate(`/os/${id}`);
  };

  const handleDelete = async (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/service/os/${id}`, {
        withCredentials: true
      });
      
      // Remove the deleted OS from the list
      setOSList(osList.filter(os => os.osid !== id));
      setFilteredOSList(filteredOSList.filter(os => os.osid !== id)); // Update filtered list
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'OS:', err);
      setError(err.response?.data || 'Échec de la suppression de l\'OS');
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleRowClick = (osId) => {
    setSelectedOSId(selectedOSId === osId ? null : osId);
  };

  const handleSort = (field) => {
    // If clicking the same field, toggle SousDirection, otherwise default to desc
    const newSousDirection = sortField === field ? 
      (sortSousDirection === 'desc' ? 'asc' : 'desc') : 
      'desc';
    
    setSortField(field);
    setSortSousDirection(newSousDirection);

    const sortedList = [...filteredOSList].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Special handling for OS ID and RE number
      if (field === 'osid' || field === 'raportFinalRE') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }
      // Special handling for date
      else if (field === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      // Special handling for orders length
      else if (field === 'orders') {
        aValue = a.orders?.length || 0;
        bValue = b.orders?.length || 0;
      }

      if (aValue < bValue) return newSousDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return newSousDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredOSList(sortedList);
  };

  // Add before the return statement
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOSList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOSList.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); 
  };

  if (loading) {
    return (
      <div className="os-table-container">
        <Sidebar />
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="os-table-container">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="os-table-content">
        <div className="os-table-header">
          <h2>Ordres de Service</h2>
          <button 
            className="create-os-btn"
            onClick={() => navigate('/create-os')}
          >
            Créer un OS
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="filters-container">
          <input
            type="text"
            className="search-input-os"
            placeholder="Rechercher par numéro d'OS, numéro d'RE ou statut..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <select
            className="status-filter"
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <option value="">Tous les statuts</option>
            <option value="Nouveau">Nouveau</option>
            <option value="Accepté">Accepté</option>
            <option value="Rejeté">Rejeté</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Annulé">Annulé</option>
          </select>
          <select 
            className="paginationOS"
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="total-items">
          Total: {filteredOSList.length} OS
        </div>


        <div className="table-container">
          <table className="os-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('osid')} className="sortable">
                  numero d'OS
                  {sortField === 'osid' && (
                    <span className="sort-indicator">
                      {sortSousDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('raportFinalRE')} className="sortable">
                  numero d'RE
                  {sortField === 'raportFinalRE' && (
                    <span className="sort-indicator">
                      {sortSousDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('date')} className="sortable">
                  Date
                  {sortField === 'date' && (
                    <span className="sort-indicator">
                      {sortSousDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Statut
                  {sortField === 'status' && (
                    <span className="sort-indicator">
                      {sortSousDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('orders')} className="sortable">
                  Nombre d'Ordres
                  {sortField === 'orders' && (
                    <span className="sort-indicator">
                      {sortSousDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((os) => (
                <React.Fragment key={os.serviceOrderID}>
                  <tr onClick={() => handleRowClick(os.osid)} className={selectedOSId === os.osid ? 'selected-row' : ''}>
                    <td>{String(os.osid).padStart(4, '0')}</td>
                    <td>{os?.raportFinalRE ? String(os.raportFinalRE).padStart(4, '0') : "Undefined"}</td>
                    <td>{formatDate(os.date)}</td>
                    <td>{os.status}</td>
                    <td>{os.orders?.length || 0}</td>
                  </tr>
                  {selectedOSId === os.osid && (
                    <tr className="options-row">
                      <td colSpan="5">  {/* Changed from 4 to 5 */}
                        <div className="options-container">
                          <button className="option-btn view-btn" onClick={() => handleViewDetails(os.osid)}>
                            Voir détails
                          </button>
                          <button className="option-btn delete-btn" onClick={() => handleDelete(os.osid)}>
                            Supprimer
                          </button>
                          <button className="option-btn cancel-btn" onClick={() => setSelectedOSId(null)}>
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              className="page-btn"
            >
              &laquo;
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              &raquo;
            </button>
          </div>
        </div>

        {deleteConfirm && (
          <div className="delete-confirmation-modal">
            <div className="modal-content">
              <h3>Confirmer la suppression</h3>
              <p>Êtes-vous sûr de vouloir supprimer cet OS? Cette action est irréversible.</p>
              <div className="modal-buttons">
                <button 
                  className="confirm-btn"
                  onClick={() => confirmDelete(deleteConfirm)}
                >
                  Confirmer
                </button>
                <button 
                  className="cancel-btn"
                  onClick={cancelDelete}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OSTable;
