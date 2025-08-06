import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthService from "../../services/login_service";
import Sidebar from "../commun/sidebare";
import "../../styles/createOS.css";

// Cache for tests
const testsCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

const CreateOS = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const mountedRef = useRef(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    orders: [
      {
        echantillonID: "",
        echantillonType: "",
        delai: 0,
        tests: [],
      },
    ],
  });

  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [testSearchTerm, setTestSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [echantillonTypes, setEchantillonTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeAbbr, setNewTypeAbbr] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [typeError, setTypeError] = useState(null);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  const fetchTests = useCallback(async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Check cache first
    const now = Date.now();
    if (
      testsCache.data &&
      testsCache.timestamp &&
      now - testsCache.timestamp < testsCache.CACHE_DURATION
    ) {
      if (mountedRef.current) {
        setAvailableTests(testsCache.data);
        setLoading(false);
      }
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/tests`, {
        withCredentials: true,
      });

      if (mountedRef.current) {
        const primaryTests = response.data.filter(
          (test) => test.isPrimaryTest === true
        );
        testsCache.data = primaryTests;
        testsCache.timestamp = now;
        setAvailableTests(primaryTests);
      }
    } catch (err) {
      if (mountedRef.current) {
        if (err.response?.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError(
            "Vous n'avez pas la permission d'accéder à cette ressource."
          );
        } else {
          setError(
            err.response?.data ||
              "Échec de la récupération des tests disponibles. Veuillez réessayer."
          );
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTests();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchTests]);

  const filteredTests = useCallback(() => {
    if (!testSearchTerm) return availableTests;

    return availableTests.filter((test) => {
      const testCode = test.testCode || "";
      return testCode.toLowerCase().includes(testSearchTerm.toLowerCase());
    });
  }, [availableTests, testSearchTerm]);

  const fetchEchantillonTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/Echantillon/types`,
        { withCredentials: true }
      );
      if (mountedRef.current) {
        setEchantillonTypes(response.data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setTypeError("Erreur lors du chargement des types d'échantillon");
      }
    } finally {
      if (mountedRef.current) {
        setLoadingTypes(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchEchantillonTypes();
  }, [fetchEchantillonTypes]);

  const handleDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      date: e.target.value,
    }));
  };

  const addOrder = () => {
    setFormData((prev) => ({
      ...prev,
      orders: [
        ...prev.orders,
        {
          echantillonID: "",
          delai: 0,
          tests: [],
        },
      ],
    }));
  };

  const removeOrder = (index) => {
    setFormData((prev) => ({
      ...prev,
      orders: prev.orders.filter((_, i) => i !== index),
    }));
  };

  const updateOrder = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      orders: prev.orders.map((order, i) => {
        if (i === index) {
          return { ...order, [field]: value };
        }
        return order;
      }),
    }));
  };

  const handleTestSelection = (orderIndex, testId, isChecked) => {
    setFormData((prev) => ({
      ...prev,
      orders: prev.orders.map((order, i) => {
        if (i === orderIndex) {
          const tests = isChecked
            ? [...order.tests, testId]
            : order.tests.filter((id) => id !== testId);
          return { ...order, tests };
        }
        return order;
      }),
    }));
  };

  const handleTypeChange = (orderIndex, value) => {
    updateOrder(orderIndex, "echantillonType", value);
    if (value === "__add_new__") {
      setShowAddType(true);
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim() || !newTypeAbbr.trim()) return;
    setAddingType(true);
    setTypeError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/Echantillon/types`,
        { name: newTypeName, abbr: newTypeAbbr },
        { withCredentials: true }
      );
      setEchantillonTypes((prev) => [...prev, response.data]);
      setFormData((prev) => ({
        ...prev,
        orders: prev.orders.map((order, i) =>
          order.echantillonType === "__add_new__"
            ? { ...order, echantillonType: response.data.name }
            : order
        ),
      }));
      setShowAddType(false);
      setNewTypeName("");
      setNewTypeAbbr("");
    } catch (err) {
      setTypeError("Erreur lors de l'ajout du type d'échantillon");
    } finally {
      setAddingType(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/service/createOS`,
        formData,
        { withCredentials: true }
      );

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/list-OS");
        }, 2000);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        navigate("/login");
      } else {
        setError(err.response?.data || "Échec de la création de l'OS");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar roles={currentUser?.roles || []} />
        <div className="content-area">
          <div className="loading">Chargement des tests disponibles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar roles={currentUser?.roles || []} />
      <div className="content-area">
        <div className="create-os-container">
          <h1>Créer un nouvel ordre de service</h1>

          {success && (
            <div className="alert alert-success">
              Ordre de service créé avec succès ! ReSousDirection...
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="os-form">
            <div className="form-group">
              <label htmlFor="date">Date :</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={handleDateChange}
                required
                className="form-control"
                min={new Date().toISOString().split("T")[0]} // 👈 This line prevents past dates
              />
            </div>

            <div className="orders-section">
              <h2>Ordres</h2>
              <button
                type="button"
                onClick={addOrder}
                className="btn btn-primary"
              >
                Ajouter un ordre
              </button>

              {formData.orders.map((order, orderIndex) => (
                <div key={orderIndex} className="order-card">
                  <div className="order-header">
                    <h3>Ordre {orderIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeOrder(orderIndex)}
                      className="btn btn-danger"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`echantillon-${orderIndex}`}>
                      ID de l'échantillon :
                    </label>
                    <input
                      type="text"
                      id={`echantillon-${orderIndex}`}
                      value={order.echantillonID || ""}
                      onChange={(e) =>
                        updateOrder(orderIndex, "echantillonID", e.target.value)
                      }
                      required
                      className="form-control"
                      placeholder="Entrez l'ID de l'échantillon"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`echantillon-type-${orderIndex}`}>
                      Type d'échantillon :
                    </label>
                    {loadingTypes ? (
                      <div>Chargement des types...</div>
                    ) : (
                      <select
                        id={`echantillon-type-${orderIndex}`}
                        value={order.echantillonType || ""}
                        onChange={(e) =>
                          handleTypeChange(orderIndex, e.target.value)
                        }
                        className="form-control"
                        required
                      >
                        <option value="" disabled>
                          Sélectionnez un type
                        </option>
                        {echantillonTypes.map((type) => (
                          <option key={type.id || type.name} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                        <option value="__add_new__">
                          Ajouter un nouveau type...
                        </option>
                      </select>
                    )}
                  </div>
                  {/* Modal or inline input for adding new type */}
                  {showAddType && order.echantillonType === "__add_new__" && (
                    <>
                      <div
                        className="modal-backdrop"
                        onClick={() => {
                          setShowAddType(false);
                          setNewTypeName("");
                          setNewTypeAbbr("");
                          updateOrder(orderIndex, "echantillonType", "");
                        }}
                      />
                      <div
                        className="modal-window"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h5>Ajouter un type d'échantillon</h5>
                        <input
                          type="text"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          placeholder="Nom du nouveau type"
                          className="form-control"
                        />
                        <input
                          type="text"
                          value={newTypeAbbr}
                          onChange={(e) => setNewTypeAbbr(e.target.value)}
                          placeholder="Abréviation du type"
                          className="form-control"
                          style={{ marginTop: 8 }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddType}
                            disabled={addingType}
                          >
                            {addingType ? "Ajout..." : "Ajouter"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setShowAddType(false);
                              setNewTypeName("");
                              setNewTypeAbbr("");
                              updateOrder(orderIndex, "echantillonType", "");
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                        {typeError && (
                          <div
                            className="alert alert-danger"
                            style={{ marginTop: 8 }}
                          >
                            {typeError}
                          </div>
                        )}
                      </div>
                      <style>{`
                        .modal-backdrop {
                          position: fixed;
                          top: 0; left: 0; right: 0; bottom: 0;
                          background: rgba(0,0,0,0.3);
                          z-index: 1000;
                        }
                        .modal-window {
                          position: fixed;
                          top: 50%; left: 50%;
                          transform: translate(-50%, -50%);
                          background: #fff;
                          padding: 24px 20px 16px 20px;
                          border-radius: 8px;
                          box-shadow: 0 2px 16px rgba(0,0,0,0.18);
                          z-index: 1001;
                          min-width: 320px;
                          max-width: 90vw;
                        }
                      `}</style>
                    </>
                  )}

                  <div className="form-group">
                    <label htmlFor={`delai-${orderIndex}`}>
                      Délai (jours) :
                    </label>
                    <input
                      type="number"
                      id={`delai-${orderIndex}`}
                      value={order.delai}
                      onChange={(e) =>
                        updateOrder(
                          orderIndex,
                          "delai",
                          parseInt(e.target.value)
                        )
                      }
                      required
                      min="0"
                      className="form-control"
                      placeholder="Entrez le délai en jours"
                    />
                  </div>

                  <div className="tests-section">
                    <h4>Sélectionnez les tests :</h4>
                    <div className="test-search-container">
                      <input
                        type="text"
                        placeholder="Rechercher des tests..."
                        value={testSearchTerm}
                        onChange={(e) => setTestSearchTerm(e.target.value)}
                        className="test-search-input"
                      />
                    </div>
                    <div className="tests-grid">
                      {filteredTests().map((test) => (
                        <div key={test.testCode} className="test-checkbox">
                          <label>
                            <input
                              type="checkbox"
                              checked={order.tests.includes(test.testCode)}
                              onChange={(e) =>
                                handleTestSelection(
                                  orderIndex,
                                  test.testCode,
                                  e.target.checked
                                )
                              }
                            />
                            {test.testCode}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Créer l'ordre de service
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/list-OS")}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOS;
