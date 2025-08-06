import { useState } from 'react';
import axios from 'axios';
import '../../styles/UploadDocument.css';
import Sidebar from '../commun/sidebare';
import AuthService from '../../services/login_service';

const DocumentUploadPage = () => {
  const [osTemplate, setOsTemplate] = useState(null);
  const [ficheEssaiTemplate, setFicheEssaiTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const currentUser = AuthService.getCurrentUser();

  const handleOsTemplateChange = (e) => {
    setOsTemplate(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleFicheEssaiTemplateChange = (e) => {
    setFicheEssaiTemplate(e.target.files[0]);
    setMessage('');
    setError('');
  };    const handleIndividualUpload = async (type, file) => {
    if (!file) {
      setError(`Please select a ${type} template first`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = type === 'osTemplate' 
        ? 'https://cetim-spring.onrender.com/api/upload/os'
        : 'https://cetim-spring.onrender.com/api/upload/fichedessai';
        
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(`${type} template uploaded successfully!`);
      if (type === 'osTemplate') {
        setOsTemplate(null);
      } else {
        setFicheEssaiTemplate(null);
      }
      // Reset the specific input field
      const inputElement = document.getElementById(type);
      if (inputElement) inputElement.value = '';
    } catch (error) {
      setError(`Error uploading ${type} template. Please try again.`);
      console.error('Upload error:', error);
    }
  };

  return (
    <div className='container'>
      <Sidebar roles={currentUser?.roles || []} />
      <div className="upload-container">
        <h2 className="upload-title">Upload Templates</h2>
        <div className="upload-form">
          <div className="upload-section">
            <div className="upload-header">
              <label htmlFor="osTemplate">OS Template:</label>
              <div className="upload-controls">
                <input
                  type="file"
                  id="osTemplate"
                  onChange={handleOsTemplateChange}
                  accept=".doc,.docx,.pdf"
                  className="file-input"
                />
                <button
                  type="button"
                  onClick={() => handleIndividualUpload('osTemplate', osTemplate)}
                  className="upload-individual-button"
                >
                  Upload OS Template
                </button>
              </div>
              {osTemplate && (
                <div className="selected-file">
                  Selected file: {osTemplate.name}
                </div>
              )}
            </div>
          </div>

          <div className="upload-section">
            <div className="upload-header">
              <label htmlFor="ficheEssaiTemplate">Fiche d'essai Template:</label>
              <div className="upload-controls">
                <input
                  type="file"
                  id="ficheEssaiTemplate"
                  onChange={handleFicheEssaiTemplateChange}
                  accept=".doc,.docx,.pdf"
                  className="file-input"
                />
                <button
                  type="button"
                  onClick={() => handleIndividualUpload('ficheEssaiTemplate', ficheEssaiTemplate)}
                  className="upload-individual-button"
                >
                  Upload Fiche d'essai
                </button>
              </div>
              {ficheEssaiTemplate && (
                <div className="selected-file">
                  Selected file: {ficheEssaiTemplate.name}
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadPage;