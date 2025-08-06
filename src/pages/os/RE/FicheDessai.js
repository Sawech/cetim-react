import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../commun/sidebare";
import "./FicheDessai.css";
import AuthService from "../../../services/login_service";

// Main Test Report Component
const FicheDessai = () => {
  const { ficheDessaiId } = useParams();
  const [expandedTest, setExpandedTest] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  const currentUser = AuthService.getCurrentUser();

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/document/fichedessai/${ficheDessaiId}/word`,
        {
          withCredentials: true,
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiche_dessai_${ficheDessaiId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Error downloading file. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/fichedessai/details/${ficheDessaiId}`,
          {
            withCredentials: true,
          }
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ficheDessaiId]);

  const toggleExpand = (testId) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Undefined";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const year = (dateString) => {
    if (!dateString) return "Undefined";
    const date = new Date(dateString);
    const year = date.getFullYear();
    return year.toString().slice(-2);
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar roles={currentUser ? currentUser.roles : []} />
        <div className="fiche-dessai-container">
          <div className="fiche-dessai-content">
            <div className="loading-spinner">
              <svg
                className="animate-spin h-10 w-10 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="ml-2 text-lg font-medium">
                Loading test report...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar roles={currentUser ? currentUser.roles : []} />
        <div className="fiche-dessai-container">
          <div className="fiche-dessai-content">
            <div className="error-message">
              <h2 className="text-xl font-bold mb-2">Error Loading Report</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex">
        <Sidebar roles={currentUser ? currentUser.roles : []} />
        <div className="fiche-dessai-container">
          <div className="fiche-dessai-content">
            <div className="error-message">
              <h2 className="text-xl font-bold mb-2">No Data Available</h2>
              <p>Could not find test report with ID: {ficheDessaiId}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="fiche-dessai-container">
        <div className="fiche-dessai-content">          <div className="fiche-dessai-header">
            <div className="flex justify-between items-center">
              <h2>Fiche Essai #{data.id}</h2>
              <button
                onClick={handleDownload}
                className="download-button"
              >
                Download Word
              </button>
            </div>
          </div>

          <table className="fichdessai">
            <tbody>
              <tr>
                <td>N° Ordre de service</td>
                <td>N° de Rapport</td>
                <td>Date O.S</td>
                <td>Code Échantillon</td>
              </tr>
              <tr>
                <td>{data.serviceOrderID || "..."}</td>
                <td>{data.raportFinalRE || "..."}</td>
                <td>{formatDate(data.osDate) || "..."}</td>
                <td>{data.order.echantillon.echantillonType.abbr +"-"+ year(data.order.echantillon.date) +"-"+ data.order.echantillon.id || "..."}</td>
              </tr>
            </tbody>
          </table>

          {data.order.tests.length === 0 &&
                <p className="text-gray-500 text-center py-4">No test results available</p>}
                <table className="fichdessai">
            <thead>
              <tr>
                <th>Désignation des Préstations</th>
                <th>Codes</th>
                <th>Nombre d'échantillon à Exécuter</th>
                <th>Code Échantillons</th>
              </tr>
            </thead>
            <tbody>
            {data.order.tests.map((test) => (
              <tr>
                <td>{test.testName}</td>
                <td>{test.testCode}</td>
                <td>...</td>
                <td>{data.order.echantillon.echantillonType.abbr +"-"+ String(data.order.echantillon.id).padStart(5, '0') || "..."}</td>
              </tr>
            ))}
            </tbody>
          </table>

          {/* Prestations Realisees Section */}
          <div className="prestations-section">
            <h3>Préstations réalisées par :</h3>
            <div className="departments">
              <div className="department">
                <span></span>
                <div className="status-indicator"></div>
              </div>
              <div className="department">
                <span></span>
                <div className="status-indicator"></div>
              </div>
            </div>
          </div>

          {/* Tests Section - If you have test details in your data */}
          {data.tests && data.tests.length > 0 && (
            <div className="tests-container">
              {data.tests.map((test) => (
                <div className="test-item" key={test.id}>
                  <div 
                    className="test-header" 
                    onClick={() => toggleExpand(test.id)}
                  >
                    <h4>{test.name}</h4>
                    <button 
                      className={`expand-button ${expandedTest === test.id ? 'expanded' : ''}`}
                    >
                      Details
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FicheDessai;