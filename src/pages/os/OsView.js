import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../commun/sidebare';
import AuthService from '../../services/login_service';
import '../../styles/OsView.css';

const OsView = () => {
    const currentUser = AuthService.getCurrentUser();
    const { id } = useParams();
    const navigate = useNavigate();
    const [serviceOrder, setServiceOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrder, setEditedOrder] = useState(null);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

    useEffect(() => {
        fetchServiceOrder();
    }, [id]);

    const fetchServiceOrder = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/api/service/os/${id}`, {
                withCredentials: true
            });
            setServiceOrder(response.data);
            setEditedOrder(response.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(
                err.response?.data?.message || 
                err.response?.data?.error || 
                err.message || 
                'Failed to load service order data'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (type) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/document/os/${id}/${type}`,
                {
                responseType: 'blob',
                withCredentials: true
                }
            );
            
            const blob = new Blob([response.data]);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Order_Service_${id}.${type === 'pdf' ? 'pdf' : 'docx'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
        } catch (err) {
            console.error(`Error downloading ${type} file:`, err);
            setError(`Failed to download ${type.toUpperCase()} file. Please try again.`);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedOrder(serviceOrder);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await axios.put(
                `${API_BASE_URL}/api/service/os/${id}`,
                editedOrder,
                {
                    withCredentials: true
                }
            );
            setServiceOrder(response.data);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating service order:', err);
            setError(
                err.response?.data?.message || 
                err.response?.data?.error || 
                err.message || 
                'Failed to update service order'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e, orderIndex, field) => {
        const newOrders = [...editedOrder.orders];
        newOrders[orderIndex] = {
            ...newOrders[orderIndex],
            [field]: e.target.value
        };
        setEditedOrder({
            ...editedOrder,
            orders: newOrders
        });
    };


    const handleAcceptOS = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/api/service/os/${id}/accept`, {}, {
                withCredentials: true
            });
            alert('OS accepted successfully');
            fetchServiceOrder(); // Refresh the service order details
        } catch (err) {
            console.error('Error accepting OS:', err);
            setError(err?.data || 'Failed to accept OS');
        }
    };

    const handleRejectOS = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/api/service/os/${id}/reject`, {}, {
                withCredentials: true
            });
            alert('OS rejected successfully');
            fetchServiceOrder(); // Refresh the service order details
        } catch (err) {
            console.error('Error rejecting OS:', err);
            setError(err.response?.data || 'Failed to reject OS');
        }
    };

    const handlestatus = async (id ,NewStatu) => {
        try {
            await axios.put(`${API_BASE_URL}/api/service/os/${id}/statu`, NewStatu, {
                withCredentials: true
            });
            alert('OS rejected successfully');
            fetchServiceOrder(); // Refresh the service order details
        } catch (err) {
            console.error('Error rejecting OS:', err);
            setError(err.response?.data || 'Failed to reject OS');
        }
    }

    if (loading) {
        return (
            <div className="app-container">
                <Sidebar roles={currentUser?.roles || []} />
                <div className="content-container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Chargement des données de l'ordre de service...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !serviceOrder) {
        return (
            <div className="app-container">
                <Sidebar roles={currentUser?.roles || []} />
                <div className="content-container">
                    <div className="error-container">
                        <div className="error-message">
                            {error || "Ordre de service introuvable"}
                        </div>
                        <button 
                            className="back-button"
                            onClick={() => navigate('/list-OS')}
                        >
                            Retour à la liste
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Sidebar roles={currentUser?.roles || []} />
            <div className="content-container">
                <div className="os-view">
                    <div className="os-header">
                        <h1>Détails de l'Ordre de Service</h1>
                        <div className="os-actions">
                            {!isEditing ? (
                                <>
                                    <button 
                                        className="download-button word"
                                        onClick={() => handleDownload('word')}
                                    >
                                        Télécharger DOCX
                                    </button>
                                    
                                    <button 
                                        className="edit-button"
                                        onClick={handleEdit}
                                    >
                                        Modifier
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        className="save-button"
                                        onClick={handleSave}
                                    >
                                        Enregistrer
                                    </button>
                                    <button 
                                        className="cancel-button"
                                        onClick={handleCancel}
                                    >
                                        Annuler
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="os-info-card">
                        <h2>Informations de l'Ordre</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Numéro d'Ordre:</label>
                                <span>{serviceOrder.osid}</span>
                            </div>
                            <div className="info-item">
                                <label>Date:</label>
                                <span>{new Date(serviceOrder.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="info-item">
                                <label>Statut:</label>
                                <span >
                                    {serviceOrder.status === 'Pending' ? 'En attente' :
                                     serviceOrder.status === 'Completed' ? 'Terminé' :
                                     serviceOrder.status === 'Processing' ? 'En cours' :
                                     serviceOrder.status || 'Non défini'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="os-orders-section">
                        <h2>Commandes</h2>
                        <div className="orders-grid">
                            {serviceOrder.orders && serviceOrder.orders.length > 0 ? (
                                serviceOrder.orders.map((order, index) => (
                                    <div key={index} className="order-card">
                                        <div className="order-header">
                                            <h3>Commande {index + 1}</h3>
                                            <span className="sample-code">
                                                Échantillon: {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedOrder.orders[index].echantillonID}
                                                        onChange={(e) => handleInputChange(e, index, 'echantillonID')}
                                                        className="edit-input"
                                                    />
                                                ) : (
                                                    order.echantillonID
                                                )}
                                            </span>
                                        </div>
                                        <div className="order-details">
                                            <div className="info-item">
                                                <label>Délai:</label>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={editedOrder.orders[index].delai}
                                                        onChange={(e) => handleInputChange(e, index, 'delai')}
                                                        className="edit-input"
                                                    />
                                                ) : (
                                                    <span>{order.delai} jours</span>
                                                )}
                                            </div>
                                            <div className="info-item tests">
                                                <label>Tests:</label>
                                                <div className="test-list">
                                                    {order.testDTOs && order.testDTOs.map((test, testIndex) => (
                                                        <div key={testIndex} className="test-item">
                                                            <span className="test-name">
                                                                {test.testCode}
                                                            </span>
                                                            {test.testName && (
                                                                <span className="test-description">
                                                                    {test.testName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-orders-message">
                                    Aucune commande trouvée pour cet ordre de service.
                                </div>
                            )}
                        </div>
                    </div>

                    {serviceOrder.status?.toLowerCase() === 'accepté' ? (
                        <button 
                            className="view-report-button"
                            onClick={() => navigate(`/raport-dessai/${serviceOrder.raportFinalRE}`)}
                        >
                            Voir le Rapport
                        </button>
                    ) : (
                        <div className="action-buttons-container">
                            <button 
                                className="accept-button"
                                onClick={() => handleAcceptOS(serviceOrder.osid)}
                            >
                                Accepter
                            </button>
                            <button 
                                className="reject-button"
                                onClick={() => handleRejectOS(serviceOrder.osid)}
                            >
                                Rejeter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OsView;