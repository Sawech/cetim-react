import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/databaseconnection.css'; // Import the CSS file
import MessageModal from '../responsewindows/MWindow'; // Import the MessageModal component

const DatabaseForm = () => {
  const [formData, setFormData] = useState({
    url: '',
    dbName: '',
    user: '',
    password: '',
    dbType: 'mysql', // Default database type
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post("https://cetim-spring.onrender.com/api/database/setup", formData);
      
      // Check if the response indicates a successful connection
      if (response.data.status === 'connected') {
        setMessage('Database connected, please restart the server');
      } else {
        setMessage(response.data.message || 'Connection failed');
      }
    } catch (error) {
      setMessage("Failed to connect: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setMessage(''); // Clear the message to close the modal
  };

  return (
    <div className="database-container">
      <div className="database-card">
        <div className="database-logo">
          <div className="database-logo-before">CETIM</div>
          <div className="database-logo-after"></div>
        </div>
        <h2 className="database-title">Insérer les informations de la base de données</h2>
        <form onSubmit={handleSubmit} className="database-form">
          {/* Menu déroulant pour le type de base de données */}
          <div className="input-group">
            <label className="input-label">Type de base de données :</label>
            <select
              name="dbType"
              value={formData.dbType}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="mysql">MySQL</option>
              <option value="mariadb">MariaDB</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">URL de la base de données :</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Nom de la base de données :</label>
            <input
              type="text"
              name="dbName"
              value={formData.dbName}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Utilisateur :</label>
            <input
              type="text"
              name="user"
              value={formData.user}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Mot de passe :</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Soumettre'}
          </button>
        </form>
      </div>

      {/* Afficher le MessageModal s'il y a un message */}
      <MessageModal message={message} onClose={closeModal} redirectTo="/login" />
    </div>
  );
};

export default DatabaseForm;