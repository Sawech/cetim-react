import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/login_service";
import axios from "axios";
import Sidebar from "../commun/sidebare";
import "../../styles/direction.css";
import "../../styles/dashboard.css";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  subMonths,
  format,
  subDays,
} from "date-fns";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import TimelineIcon from "@mui/icons-material/Timeline";
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

const SousDirecteurDashboard = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("global");  const [chartData, setChartData] = useState({
    osOverTime: [],
    statusDistribution: [],
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const getFilteredData = (data, filter) => {
    const now = new Date();
    let filterDate;

    switch (filter) {
      case "week":
        filterDate = startOfWeek(now);
        break;
      case "month":
        filterDate = startOfMonth(now);
        break;
      case "year":
        filterDate = startOfYear(now);
        break;
      default:
        return data;
    }

    return data.filter((item) => new Date(item.createdAt) >= filterDate);
  };

  const calculateTrend = (currentData, previousData) => {
    if (!previousData) return 0;
    return ((currentData - previousData) / previousData) * 100;
  };

  const fetchSousDirecteurStats = async () => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
    try {
      const [osRes, ficheEssaiRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/service/os`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/api/fichedessai`, {
          withCredentials: true,
        }),
      ]);

      const filteredOS = getFilteredData(osRes.data, timeFilter);
      const filteredFicheEssai = getFilteredData(ficheEssaiRes.data, timeFilter);

      // Calculate previous period data for trends
      const previousPeriodDate =
        timeFilter === "week"
          ? subDays(new Date(), 7)
          : timeFilter === "month"
          ? subMonths(new Date(), 1)
          : timeFilter === "year"
          ? subMonths(new Date(), 12)
          : subMonths(new Date(), 1);

      const previousOS = osRes.data.filter(
        (os) =>
          new Date(os.createdAt) >= previousPeriodDate &&
          new Date(os.createdAt) < new Date()
      ).length;

      // Monthly trend data
      const osOverTime = Array.from({ length: 12 }, (_, i) => {
        const month = subMonths(new Date(), i);
        const osInMonth = osRes.data.filter(
          (os) =>
            new Date(os.createdAt).getMonth() === month.getMonth() &&
            new Date(os.createdAt).getFullYear() === month.getFullYear()
        );
        return {
          name: format(month, "MMM"),
          count: osInMonth.length,
          completed: osInMonth.filter((os) => os.status === "Terminé").length,
        };
      }).reverse();

      // Status distribution with percentages
      const totalFiches = filteredFicheEssai.length;
      const statusDistribution = [
        {
          name: "En attente",
          value: filteredFicheEssai.filter((f) => f.status === "En attente")
            .length,
          percentage: (
            (filteredFicheEssai.filter((f) => f.status === "En attente").length /
              totalFiches) *
            100
          ).toFixed(1),
        },
        {
          name: "En cours",
          value: filteredFicheEssai.filter((f) => f.status === "En cours")
            .length,
          percentage: (
            (filteredFicheEssai.filter((f) => f.status === "En cours").length /
              totalFiches) *
            100
          ).toFixed(1),
        },
        {
          name: "Terminé",
          value: filteredFicheEssai.filter((f) => f.status === "Terminé")
            .length,
          percentage: (
            (filteredFicheEssai.filter((f) => f.status === "Terminé").length /
              totalFiches) *
            100
          ).toFixed(1),
        },
      ];      setChartData({
        osOverTime,
        statusDistribution,
      });

      setStats([
        {
          title: "Ordres de Service",
          subTitle: "Total des OS",
          link: "list-OS",
          length: filteredOS.length,
          icon: <AssignmentIcon />,
          trend: calculateTrend(filteredOS.length, previousOS),
        },
        {
          title: "Fiches d'Essai",
          subTitle: "Total des Fiches",
          link: "fiches-dessai",
          length: filteredFicheEssai.length,
          icon: <DescriptionIcon />,
          trend: calculateTrend(
            filteredFicheEssai.length,
            filteredFicheEssai.filter(
              (f) => new Date(f.createdAt) >= previousPeriodDate
            ).length
          ),
        },
        {
          title: "Taux de Complétion",
          subTitle: "Fiches terminées",
          link: "esseis-list",
          length: `${(
            (filteredFicheEssai.filter((f) => f.status === "Terminé").length /
              filteredFicheEssai.length) *
            100
          ).toFixed(1)}%`,
          icon: <TimelineIcon />,
          trend: 0,
        },
      ]);
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

    if (!user.roles.includes("Sous_directeur")) {
      setError("Unauthorized access");
      setLoading(false);
      return;
    }

    fetchSousDirecteurStats();
    setLoading(false);
  }, [timeFilter]);

  const handleTimeFilterChange = (event) => {
    setTimeFilter(event.target.value);
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
    <ThemeProvider theme={theme}>
      <div className="dashboard-container">
        <Sidebar roles={user ? user.roles : []} />
        <div className="dashboard-content">
          <Box className="dashboard-header">
            <Typography variant="h4" gutterBottom>
              Tableau de Bord
            </Typography>
            <FormControl
              sx={{
                minWidth: 200,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": {
                  color: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiSelect-icon": {
                  color: "white",
                },
              }}
            >
              <InputLabel>Période</InputLabel>
              <Select
                value={timeFilter}
                onChange={handleTimeFilterChange}
                sx={{
                  "& .MuiSelect-select": {
                    color: "white",
                  },
                }}
              >
                <MenuItem value="global">Global</MenuItem>
                <MenuItem value="week">Cette semaine</MenuItem>
                <MenuItem value="month">Ce mois</MenuItem>
                <MenuItem value="year">Cette année</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          <Grid container spacing={3} sx={{ mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {stats.map((stat) => (
              <Grid item xs={12} sm={6} md={3} key={stat.title}>
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      {stat.icon}
                      {stat.trend !== 0 && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {stat.trend > 0 ? (
                            <TrendingUpIcon color="success" />
                          ) : (
                            <TrendingDownIcon color="error" />
                          )}
                          <Typography
                            variant="body2"
                            color={stat.trend > 0 ? "success.main" : "error.main"}
                          >
                            {Math.abs(stat.trend).toFixed(1)}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
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

          <Grid container spacing={3} sx={{ mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Grid item xs={12} md={8}>
              <Paper className="chart-container" sx={{ p: 3 }}>
                <Typography className="chart-title">
                  Évolution des Ordres de Service
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.osOverTime}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#388e3c" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#388e3c" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1976d2"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      name="Total OS"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#388e3c"
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="OS Terminés"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper className="chart-container" sx={{ p: 3 }}>
                <Typography className="chart-title">
                  Distribution des Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                    >
                      {chartData.statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: "#666", fontWeight: 500 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>            {/* Grid item for performance removed as it's not relevant for sous_directeur */}
          </Grid>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default SousDirecteurDashboard;
