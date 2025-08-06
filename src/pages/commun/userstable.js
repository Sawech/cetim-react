import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import Sidebar from '../commun/sidebare.js';
import AuthService from '../../services/login_service.js';
import '../../styles/userstable.css';

const UsersList = () => {

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





  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', SousDirection: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); // Initialize without relying on currentUser

      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
  // Fetch users from the backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/superadmin/getusers`, {
          withCredentials: true,
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRowClick = (userId) => {
    setSelectedUserId(userId); // Set the selected user ID directly from the table
  };

  // Handle option selection
  const handleOptionSelect = (option, userId) => {
    if (option === 'profile') {
      navigate(`/utilisateur_profil/${userId}`); // Redirect to profile with userId in the URL
    } else if (option === 'tasks') {
      navigate(`/utilisateur_tasks/${userId}`); // Redirect to tasks
    } else if (option === 'delete') {
      handleDeleteUser(userId); // Call delete handler
    }
    setSelectedUserId(null); // Reset selected user
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/superadmin/deleteusers/${userId}`, {
          withCredentials: true,
        });
        setUsers(users.filter(user => user.id !== userId)); // Update the local state
        alert('User deleted successfully!');
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const filteredUsers = users.filter(user => {
  const id = user.id.toString() || 'Undefined'; // Fallback to empty string if null/undefined
  const firstName = user.firstName || 'Undefined'; // Fallback to empty string if null/undefined
  const lastName = user.lastName || 'Undefined'; // Fallback to empty string if null/undefined
  const username = user.username || 'Undefined';
  const email = user.email || 'Undefined'; // Fallback to empty string if null/undefined
  const role = user.role || 'Undefined'; // Fallback to empty string if null/undefined
  const SousDirection = user.SousDirection || 'Undefined'; // Fallback to empty string if null/undefined

  return (
    id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    SousDirection.toLowerCase().includes(searchTerm.toLowerCase())
  );
});

  // Sort users
  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.SousDirection === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.SousDirection === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let SousDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.SousDirection === 'ascending') {
      SousDirection = 'descending';
    }
    setSortConfig({ key, SousDirection });
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get sort arrow
  const getSortArrow = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.SousDirection === 'ascending' ? ' ↑' : ' ↓';
    }
    return '';
  };

  // Display loading or error messages
  if (loading) {
    return <div className="loading">Chargement des utilisateurs...</div>;
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
            <h1>Gestion des utilisateurs</h1>
            <Link to="/ajoute-utilisateur" className="add-user-btn">
              <span className="btn-icon">+</span> Ajouter un utilisateur
            </Link>
          </div>

          <div className="users-controls">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Rechercher des utilisateurs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-users"
              />
            </div>
            <div className="filter-container">
              {/* Des filtres supplémentaires peuvent être ajoutés ici */}
            </div>
          </div>

          {users.length === 0 ? (
            <div className="no-users">
              <p>Aucun utilisateur trouvé. Cliquez sur le bouton "Ajouter un utilisateur" pour en créer un.</p>
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
                      <th onClick={() => requestSort('lastName')}>
                        Nom{getSortArrow('lastName')}
                      </th>
                      <th onClick={() => requestSort('firstName')}>
                        Prénom{getSortArrow('firstName')}
                      </th>
                      <th onClick={() => requestSort('phonenumber')}>
                        Numéro de téléphone{getSortArrow('phonenumber')}
                      </th>
                      <th onClick={() => requestSort('email')}>
                        Email{getSortArrow('email')}
                      </th>
                      <th onClick={() => requestSort('role')}>
                        Rôle{getSortArrow('role')}
                      </th>
                      <th onClick={() => requestSort('SousDirection')}>
                        SousDirection{getSortArrow('SousDirection')}
                      </th>
                      <th onClick={() => requestSort('Service')}>
                        Service{getSortArrow('Service')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user) => (
                      <React.Fragment key={user.id}>
                        <tr onClick={() => handleRowClick(user.id)}>
                          <td>{user.id}</td>
                          <td>{user.lastName}</td>
                          <td>{user.firstName}</td>
                          <td>{user.phonenumber ? user.phonenumber : "/"}</td>
                          <td>{user.email ? user.email : "/"}</td>
                          <td>
                            <span className={`role-badge `}>
                              {user.role}
                            </span>
                          </td>
                          <td>{user.sousDirection ? user.sousDirection : "/"}</td>
                          <td>{user.service ? user.service : "/"}</td>
                        </tr>
                        {selectedUserId === user.id && (
                          <tr className="options-row">
                            <td colSpan="7">
                              <div className="options-container">
                                <button
                                  className="option-btn profile-btn"
                                  onClick={() => handleOptionSelect('profile', user.id)}
                                >
                                  Voir le profil
                                </button>
                                <button
                                  className="option-btn tasks-btn"
                                  onClick={() => handleOptionSelect('tasks', user.id)}
                                >
                                  Voir les tâches
                                </button>
                                <button
                                  className="option-btn"
                                  onClick={() => handleOptionSelect('delete', user.id)}
                                >
                                  Supprimer
                                </button>
                                <button
                                  className="option-btn cancel-btn"
                                  onClick={() => setSelectedUserId(null)}
                                >
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

export default UsersList;