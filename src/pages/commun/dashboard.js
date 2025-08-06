import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/login_service';
import axios from 'axios';
import Sidebar from './sidebare';
import '../../styles/SousDirection.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [stats, setStats] = useState({
    users: 0,
    os: 0,
    ficheEssai: 0
  });
  const [osStatus, setOsStatus] = useState([]);
  const [ficheStatus, setFicheStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchAllData = async () => {
      try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
        const [usersRes, osRes, ficheEssaiRes, osStatusRes, ficheStatusRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/superadmin/getusers`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/service/os`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/fichedessai`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/service/os/status`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/service/ficheessai/status`, { withCredentials: true })
        ]);

        // Set counts
        setStats({
          users: usersRes.data.length,
          os: osRes.data.length,
          ficheEssai: ficheEssaiRes.data.length
        });

        // Process OS status data for the chart
        const osStatusData = processStatusData(osStatusRes.data);
        setOsStatus(osStatusData);

        // Process fiche d'essai status data for the chart
        const ficheStatusData = processStatusData(ficheStatusRes.data);
        setFicheStatus(ficheStatusData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Erreur lors du chargement des données!");
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Helper function to process status data for the charts
  const processStatusData = (data) => {
    // Group by status and count
    const statusCounts = data.reduce((acc, item) => {
      const status = item.status?.displayName || 'Non défini';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    // Convert to array format needed for charts
    return Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    }));
  };

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar roles={user ? user.roles : []} />
        <div className="loading">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar roles={user ? user.roles : []} />
      <div className="dashboard-content">
        <h1>Tableau de Bord</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Utilisateurs</h3>
              <i className="fas fa-users"></i>
            </div>
            <div className="dashboard-card-value">{stats.users}</div>
            <div className="dashboard-card-footer">Total des utilisateurs</div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Ordres de Service</h3>
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="dashboard-card-value">{stats.os}</div>
            <div className="dashboard-card-footer">Total des OS</div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Fiches d'Essai</h3>
              <i className="fas fa-clipboard-check"></i>
            </div>
            <div className="dashboard-card-value">{stats.ficheEssai}</div>
            <div className="dashboard-card-footer">Total des fiches d'essai</div>
          </div>
        </div>

        {/* OS Status Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Statut des Ordres de Service</h2>
          </div>
          <div className="chart-content" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={osStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {osStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fiches d'Essai Status Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Statut des Fiches d'Essai</h2>
          </div>
          <div className="chart-content" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ficheStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {ficheStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OS Status Table */}
        <h2>Détails des Ordres de Service</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Nombre</th>
                <th>Pourcentage</th>
              </tr>
            </thead>
            <tbody>
              {osStatus.length > 0 ? (
                osStatus.map((status, index) => (
                  <tr key={index}>
                    <td>{status.name}</td>
                    <td>{status.value}</td>
                    <td>{((status.value / stats.os) * 100).toFixed(1)}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">Aucune donnée disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Fiches d'Essai Status Table */}
        <h2>Détails des Fiches d'Essai</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Nombre</th>
                <th>Pourcentage</th>
              </tr>
            </thead>
            <tbody>
              {ficheStatus.length > 0 ? (
                ficheStatus.map((status, index) => (
                  <tr key={index}>
                    <td>{status.name}</td>
                    <td>{status.value}</td>
                    <td>{((status.value / stats.ficheEssai) * 100).toFixed(1)}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">Aucune donnée disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;