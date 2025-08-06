import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../commun/sidebare";
import "../../styles/userform.css";
import style from "../../styles/userform.css"; // Updated import
import superadminservices from "../../services/superadminservices";
import AuthService from '../../services/login_service';
import MessageModal from "../responsewindows/MWindow";
import axios from 'axios';

const AddUser = () => {

  const navigate = useNavigate();
  const currentuser = AuthService.getCurrentUser();

  useEffect(() => {
    fetchSousDirection();
  }, []);



  const fetchSousDirection = async () => {
    try {
      
      const response = await axios.get('https://cetim-spring.onrender.com/api/SousDirections');
      setSousDirection(response.data);
    } catch (err) {
      setError('Failed to fetch services');
    }
  };

  /**
   * 
   * 
   * 
   */
  const [modal, setModal] = useState({
    show: false, // Controls whether the modal is visible
    message: "", // The message to display in the modal
    type: "", // Type of message (e.g., "success" or "error")
    redirectTo: null, // Optional: Redirect after closing the modal
  });
  

  const [errors, setErrors] = useState({});
  
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    username: "", // Add username field
    password: "",
    confirmPassword: "",
    phonenumber: "",
    email: "",
    role: "operateur",
    SousDirection: "",
    service: "",
    notes: "",
  });

  const [SousDirections, setSousDirection] = useState([]);
  const [error, setError] = useState(null);
  const [showSousDirectionInput, setShowSousDirectionInput] = useState(false);
  const [selectedSousDirection, setSelectedSousDirection] = useState(null);

  // Updated the phone number validation to allow empty values.
  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (user.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (user.password !== user.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (user.email && !emailPattern.test(user.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const phonePattern = /^\d{10}$/;
    if (user.phonenumber && !phonePattern.test(user.phonenumber.replace(/\D/g, ""))) {
      newErrors.phonenumber = "Please enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleRoleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));

    // Hide SousDirection input if role is Directeur or chargé d'enregistrement
    if (value === "Directeur" || value === "chargé_denregistrement") {
      setUser((prevUser) => ({
        ...prevUser,
        SousDirection: "", // Clear SousDirection value
      }));
      setShowSousDirectionInput(false);
    } else {
      setShowSousDirectionInput(true);
    }
  };

  const handleSousDirectionChange = (e) => {
    const value = e.target.value;
    setUser((prevUser) => ({
      ...prevUser,
      SousDirection: value,
      service: "", // Reset service when SousDirection changes
    }));
    const dir = SousDirections.find((d) => d.name === value);
    setSelectedSousDirection(dir || null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted", user); // Debugging log

    if (validateForm()) {
      superadminservices
        .adduser(user)
        .then(() => {
          setModal({
            show: true,
            message: "Utilisateur a été ajouté avec succès!",
            type: "success",
            redirectTo: "/list-utilisateurs", // Redirect to the users list page
          });

          // Reset form after submission
          setUser({
            firstName: "",
            lastName: "",
            username: "", // Reset username
            password: "",
            confirmPassword: "",
            phonenumber: "",
            email: "",
            role: "operateur",
            SousDirection: "",
            notes: "",
          });
        })
        .catch((error) => {
          const resMessage =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString();

          setModal({
            show: true,
            message: resMessage,
            type: "error",
            redirectTo: null, // No redirect for errors
          });
        });
    }
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
  };

  return (
    <div className="app-container">
      <Sidebar roles={currentuser ? currentuser.roles : []} />
      <div className="content-area">
        <div className="form-container">
          <h1 className="form-title">ajouter un utilisateur</h1>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">nom</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={user.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">prenom</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={user.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  className={style.usernameinput}
                  id="username"
                  type="text"
                  name="username"
                  value={user.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">numero de telephon</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  name="phonenumber"
                  value={user.phonenumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
                {errors.phoneNumber && <span className="error-text">{errors.phonenumber}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">mote de passe</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={user.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer mote de passe</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={user.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={user.role}
                  onChange={handleRoleChange}
                  required
                >
                  <option value="">Select a role</option>
                  <option value="Directeur">Directeur</option>
                  <option value="Sous_directeur">Sous directeur</option>
                  <option value="Chef_service">Chef service</option>
                  <option value="Operateur">Operateur</option>
                  <option value="chargé_denregistrement">chargé d'enregistrement</option>
                </select>
              </div>
              {showSousDirectionInput && (
                <div className="form-group">
                  <label htmlFor="SousDirection">SousDirection</label>
                  <select
                    id="SousDirection"
                    name="SousDirection"
                    value={user.SousDirection}
                    onChange={handleSousDirectionChange}
                  >
                    <option value="">Select a SousDirection</option>
                    {SousDirections.map(SousDirection => (
                      <option key={SousDirection.name} value={SousDirection.name}>
                        {SousDirection.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {showSousDirectionInput && selectedSousDirection && selectedSousDirection.service && selectedSousDirection.service.length > 0 && user.role !== "Sous_directeur" && (
                <div className="form-group">
                  <label htmlFor="service">Service</label>
                  <select
                    id="service"
                    name="service"
                    value={user.service}
                    onChange={handleChange}
                  >
                    <option value="">Select a service</option>
                    {selectedSousDirection.service.map(service=> (
                      <option key={service.id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="form-group notes-group">
              <label htmlFor="notes">remarque</label>
              <textarea
                id="notes"
                name="notes"
                value={user.notes}
                onChange={handleChange}
                placeholder="Add any additional information about this user"
                rows="4"
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-submit">ajouter</button>
              <button type="button" className="btn-cancel" onClick={() => window.history.back()}>Annuler</button>
            </div>
          </form>

          {/* Render the MessageModal if show is true */}
          {modal.show && (
            <MessageModal
              message={modal.message}
              onClose={closeModal}
              redirectTo={modal.redirectTo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddUser;