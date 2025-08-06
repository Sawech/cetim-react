import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/login_service";
import axios from "axios";
import Sidebar from "../commun/sidebare";
import "../../styles/direction.css";
import "../../styles/dashboard.css";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#64b5f6",
      dark: "#1565c0",
    },
    secondary: {
      main: "#388e3c",
      light: "#81c784",
      dark: "#2e7d32",
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      color: "#fff",
    },
    h6: {
      fontWeight: 600,
      color: "#1976d2",
      marginBottom: "1rem",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        },
      },
    },
  },
});

const ChefServiceDashboard = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChefStats = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
      const [testsRes, assignsRes, esseisRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tests`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/api/assigns`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/api/fichedessai`, {
          withCredentials: true,
        }),
      ]);

      const esseis = esseisRes.data.filter((essei) => {
        return essei.order.tests.some(
          (test) => test.service === user.service
        );
      });

      setStats([
        {
          title: "Tests",
          subTitle: "Total des Tests",
          link: "tests-list",
          length: testsRes.data.filter((test) => test.isPrimaryTest === true)
            .length,
        },
        {
          title: "Assigns",
          subTitle: "Total des Assignments",
          link: "assigns-list",
          length: assignsRes.data.filter(
            (assign) => assign.service === user.service
          ).length,
        },
        {
          title: "Fiches d'Esseis",
          subTitle: "Total des Fiches d'Esseis",
          link: "esseis-list",
          length: esseis.length,
        },
      ]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("No Data Found!");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!user.roles.includes("Chef_service")) {
      setError("Unauthorized access");
      setLoading(false);
      return;
    }

    fetchChefStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar roles={user ? user.roles : []} />
        <div className="loading">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="dashboard-container">
        <Sidebar roles={user ? user.roles : []} />
        <div className="dashboard-content">
          <Box className="dashboard-header">
            <Typography variant="h4" gutterBottom>
              Tableau de Bord - Chef de Service
            </Typography>
          </Box>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {stats.map((stat) => (
              <Grid item xs={12} sm={6} md={4} key={stat.title}>
                <Card
                  className="stat-card"
                  onClick={() => navigate(`/${stat.link}`)}
                  sx={{
                    cursor: "pointer",
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="h3" component="div">
                      {stat.length}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="body2">
                      {stat.subTitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default ChefServiceDashboard;
