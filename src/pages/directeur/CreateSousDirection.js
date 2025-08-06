import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../commun/sidebare";
import AuthService from "../../services/login_service";
import "../../styles/CreateSousDirection.css";

const CreateSousDirection = () => {
  const currentuser = AuthService.getCurrentUser();

  const [formData, setFormData] = useState({
    name: "",
    color: "",
    description: "",
  });
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [SousDirections, setSousDirections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    fetchSousDirections();
  }, []);

  const fetchSousDirections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/SousDirections`);
      console.log("API Response:", response.data); // Log the API response for debugging
      if (Array.isArray(response.data)) {
        setSousDirections(response.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setSousDirections([]); // Fallback to an empty array
      }
    } catch (err) {
      console.error("Failed to fetch SousDirections:", err);
      setSousDirections([]); // Fallback to an empty array
    } finally {
      setTableLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addService = () => {
    setServices((prev) => [...prev, newService]);
    setNewService({ name: "", description: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const SousDirectionResponse = await axios.post(
        `${API_BASE_URL}/api/SousDirections`,
        formData,
        {
          withCredentials: true,
        }
      );

      const SousDirectionId = SousDirectionResponse.data.id;

      for (const service of services) {
        await axios.post(
          `${API_BASE_URL}/api/SousDirections/${SousDirectionId}/services`,
          service,
          {
            withCredentials: true,
          }
        );
      }

      setFormData({ name: "", color: "", description: "" });
      setServices([]);
      setSuccess(true);
      fetchSousDirections(); // Refresh the table after adding a new SousDirection
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while creating the SousDirection"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this SousDirection?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/SousDirections/${id}`);
        fetchSousDirections(); // Refresh the table after deletion
      } catch (err) {
        setError("Failed to delete SousDirection");
      }
    }
  };

  const getColorCode = (colorName) => {
    switch (colorName) {
      case "rouge":
        return "#ff0000";
      case "blue":
        return "#0000ff";
      case "jaune":
        return "#ffff00";
      case "vert":
        return "#008000";
      default:
        return "white";
    }
  };

  return (
    <div className="create-SousDirection-container">
      <Sidebar roles={currentuser ? currentuser.roles : []} />
      <div className="create-SousDirection-content">
        <h1>SousDirection Management</h1>
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            SousDirection and services created successfully!
          </div>
        )}

        <div className="SousDirection-form-container">
          <h2>Add New SousDirection</h2>
          <form onSubmit={handleSubmit} className="SousDirection-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">Color</label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                className="form-control"
                style={{
                  backgroundColor: formData.color
                    ? getColorCode(formData.color)
                    : "white",
                  color: formData.color ? "white" : "black",
                }}
              >
                <option
                  value=""
                  style={{ backgroundColor: "white", color: "black" }}
                >
                  Select a color
                </option>
                <option
                  value="rouge"
                  style={{ backgroundColor: "white", color: "black" }}
                >
                  Rouge
                </option>
                <option
                  value="blue"
                  style={{ backgroundColor: "white", color: "black" }}
                >
                  Blue
                </option>
                <option
                  value="jaune"
                  style={{ backgroundColor: "white", color: "black" }}
                >
                  Jaune
                </option>
                <option
                  value="vert"
                  style={{ backgroundColor: "white", color: "black" }}
                >
                  Vert
                </option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="4"
              />
            </div>

            <h3>Services</h3>
            <div className="form-group">
              <label htmlFor="service-name">Service Name</label>
              <input
                type="text"
                id="service-name"
                name="name"
                value={newService.name}
                onChange={handleServiceChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="service-description">Service Description</label>
              <textarea
                id="service-description"
                name="description"
                value={newService.description}
                onChange={handleServiceChange}
                className="form-control"
                rows="2"
              />
            </div>
            <button
              type="button"
              onClick={addService}
              className="add-service-button"
            >
              Add Service
            </button>

            <ul className="services-list">
              {services.map((service, index) => (
                <li key={index}>
                  {service.name} - {service.description}
                </li>
              ))}
            </ul>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create SousDirection"}
              </button>
            </div>
          </form>
        </div>

        <div className="SousDirections-table-container">
          <h2>Existing SousDirections</h2>
          {tableLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading SousDirections...</p>
            </div>
          ) : (
            <table className="SousDirections-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {SousDirections.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="no-data">
                      No SousDirections found
                    </td>
                  </tr>
                ) : (
                  SousDirections.map((SousDirection) => (
                    <tr key={SousDirection.id}>
                      <td>{SousDirection.name}</td>
                      <td>{SousDirection.description}</td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(SousDirection.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSousDirection;
