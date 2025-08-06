import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import axios from 'axios';
import AuthService from '../../services/login_service';
import Sidebar from '../commun/sidebare';
import './fichesdessai.css'; 

const Ficheessaidir = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [fichesList, setFichesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedficheId, setSelectedficheId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFichesDessai = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`https://cetim-spring.onrender.com/api/fichedessai`, { // Use the id here
          withCredentials: true
        });

        if (!isMounted) return;

        if (response.data) {
          setFichesList(response.data);
        } else {
          setError('Aucune donnée fiche d essai disponible');
        }
      } catch (err) {
        if (!isMounted) return;

        console.error('Erreur lors de la récupération des fiches d essais:', err);
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

    fetchFichesDessai();

    return () => {
      isMounted = false;
    };
  }, []); // Add id as a dependency

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
    navigate(`/fiche-dessai/${id}`);
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id) => {
    try {
      // Add delete logic here
    } catch (err) {
      console.error(err);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleRowClick = (id) => {
    setSelectedficheId(selectedficheId === id ? null : id);
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
    <div className="essais-table-container">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="essais-table-content">
        <div className="essais-table-header">
          <h2>fiches d'essais</h2>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="table-container">
          <table className="essais-table">
            <thead>
              <tr>
                <th>code echantillon</th>
                <th>Date</th>
                <th>nombre des prestation</th>
                <th>delai</th>
              </tr>
            </thead>
            <tbody>
              {fichesList.map((fiche) => (
                <React.Fragment key={fiche.id}>
                  <tr onClick={() => handleRowClick(fiche.id)} className={selectedficheId === fiche.id ? 'selected-row' : ''}>
                    <td>{fiche.order.echantillon.echantillonCode}</td>
                    <td>{formatDate(fiche.creationDate)}</td>
                    <td>{fiche.order.tests.length}</td>
                    <td>{fiche.order.delai}</td>
                  </tr>
                  {selectedficheId === fiche.id && ( // Fix the condition here
                    <tr className="options-row">
                      <td colSpan="4">
                        <div className="options-container">
                          <button
                            className="option-btn view-btn"
                            onClick={() => handleViewDetails(fiche.id)}
                          >
                            Voir détails
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

export default Ficheessaidir;