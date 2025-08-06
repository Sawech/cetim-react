import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './sidebare';
import AuthService from '../../services/login_service';
import '../../styles/userprofile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from the URL
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [navigate, currentUser]);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  const fetchUserData = async (userId) => {
    try {
      // Fetch the full user data from the server using the provided userId
      const response = await axios.get(`${API_BASE_URL}/api/superadmin/getusers/${userId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      setUser(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      let errorMessage = 'Failed to fetch user data. Please try again later.';

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          navigate('/login');
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to access this resource.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData(userId); // Fetch data for the user based on userId from the URL
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') {
      if (value && value.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      } else {
      setPasswordError('');
      }
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePhoto: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (formData.password && formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    try {
      const updatedData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'profilePhoto' && formData[key]) {
          updatedData.append(key, formData[key]);
        }
      });

      if (profilePhoto) {
        updatedData.append('profilePhoto', profilePhoto);
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        updatedData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUser(response.data);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(user);
    setPasswordError('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar roles={currentUser?.roles || []} />
        <div className="content-area">
          <div className="loading">Loading user profile...</div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="app-container">
        <Sidebar roles={currentUser?.roles || []} />
        <div className="content-area">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar roles={currentUser?.roles || []} />
      <div className="content-area">
        <div className="profile-container">
          <div className="profile-header">
            <h1>User Profile</h1>
            <button className="back-btn" onClick={() => navigate(-1)}>
              &larr; Back
            </button>
          </div>

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <div className="profile-details">
            <div className="profile-photo-section">
              <div className="profile-photo">
                <img
                  src={formData.profilePhoto || user?.profilePhoto || '/images/defaultprofilephoto.jpeg'}
                  alt="Profile"
                  onError={(e) => {
                    e.target.src = '/images/defaultprofilephoto.jpeg';
                  }}
                />
              </div>
              {isEditing && (
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
              )}
            </div>

            <div className="edit-save-buttons">
              {!isEditing ? (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={handleSubmit}>
                    Save Changes
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              )}
            </div>

            <div className="profile-info">
              <div className="form-group">
                <label>First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <div className="info-value">{user?.firstName}</div>
                )}
              </div>

              <div className="form-group">
                <label>Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <div className="info-value">{user?.lastName}</div>
                )}
              </div>

              <div className="form-group">
                <label>Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <div className="info-value">{user?.username}</div>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <div className="info-value">{user?.email}</div>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phonenumber"
                    value={formData.phonenumber || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <div className="info-value">{user?.phonenumber || 'Not provided'}</div>
                )}
            </div>

              <div className="form-group">
                <label>Role</label>
                {isEditing ? (
                  <select
                    name="role"
                    value={formData.role || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="">Select a role</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                    <option value="operateur">Operateur</option>
                    <option value="Chef_service">Chef Service</option>
                    <option value="SousDirection">SousDirection</option>
                  </select>
                ) : (
                  <div className="info-value role-badge">{user?.role || 'Not assigned'}</div>
                )}
              </div>

              <div className="form-group">
                <label>SousDirection</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="SousDirection"
                    value={formData.SousDirection || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <div className="info-value">{user?.SousDirection || 'Not assigned'}</div>
                )}
            </div>

              <div className="form-group">
                <label>Password</label>
                {isEditing ? (
                  <>
                    <input
                      type="password"
                      name="password"
                      value={formData.password || ''}
                    onChange={handleInputChange}
                      className="form-control"
                      placeholder="Leave blank to keep current password"
                  />
                    {passwordError && (
                      <div className="error-message">{passwordError}</div>
                    )}
                  </>
                ) : (
                  <div className="info-value">••••••••</div>
                )}
              </div>
            </div>

            <div className="additional-info">
              <h3>Additional Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Account Created:</span>
                  <span className="info-value">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated:</span>
                  <span className="info-value">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Login:</span>
                  <span className="info-value">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge ${user?.active ? 'active' : 'inactive'}`}>
                    {user?.active ? 'Active' : 'Inactive'}
                  </span>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;