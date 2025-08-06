import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/login_service";
import axios from "axios";
import Sidebar from "../commun/sidebare";
import "../../styles/direction.css";
import "../../styles/dashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
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
  IconButton,
  Divider,
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
import PeopleIcon from "@mui/icons-material/People";
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

const data = [
  {
    name: "Page A",
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: "Page B",
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: "Page C",
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: "Page D",
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: "Page E",
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: "Page F",
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: "Page G",
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

const DirecteurDashboard = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("global");
  const [chartData, setChartData] = useState({
    osOverTime: [],
    statusDistribution: [],
    SousDirectionStats: [],
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

  const fetchDirectorStats = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";
      const [usersRes, osRes, ficheEssaiRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/superadmin/getusers`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/api/service/os`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/api/fichedessai`, {
          withCredentials: true,
        }),
      ]);

      // Map OS data to use 'date' field as 'createdAt'
      const osData = osRes.data.map((os) => ({
        ...os,
        createdAt: os.date, // Use actual date field from API
      }));

      const filteredOS = getFilteredData(osData, timeFilter);
      const filteredFicheEssai = getFilteredData(
        ficheEssaiRes.data,
        timeFilter
      );

      // Calculate previous period data for trends
      const previousPeriodDate =
        timeFilter === "week"
          ? subDays(new Date(), 7)
          : timeFilter === "month"
          ? subMonths(new Date(), 1)
          : timeFilter === "year"
          ? subMonths(new Date(), 12)
          : subMonths(new Date(), 1);

      const previousOS = osData.filter(
        (os) =>
          new Date(os.createdAt) >= previousPeriodDate &&
          new Date(os.createdAt) < new Date()
      ).length;

      // Monthly trend data
      const osOverTime = Array.from({ length: 12 }, (_, i) => {
        const month = subMonths(new Date(), i);
        const osInMonth = osData.filter(
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
            (filteredFicheEssai.filter((f) => f.status === "En attente")
              .length /
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
      ];

      // SousDirection performance analysis
      const SousDirectionPerformance = {};
      filteredOS.forEach((os) => {
        if (os.SousDirection) {
          if (!SousDirectionPerformance[os.SousDirection]) {
            SousDirectionPerformance[os.SousDirection] = {
              total: 0,
              completed: 0,
              inProgress: 0,
            };
          }
          SousDirectionPerformance[os.SousDirection].total++;
          if (os.status === "Terminé") {
            SousDirectionPerformance[os.SousDirection].completed++;
          } else if (os.status === "En cours") {
            SousDirectionPerformance[os.SousDirection].inProgress++;
          }
        }
      });

      setChartData({
        osOverTime,
        statusDistribution,
      });

      const osCompletionRate =
        filteredOS.length > 0
          ? (filteredOS.filter((os) => os.status === "Terminé").length /
              filteredOS.length) *
            100
          : 0;
      setStats([
        {
          title: "Utilisateurs",
          subTitle: "Total des utilisateurs",
          link: "list-utilisateurs",
          length: usersRes.data.length,
          icon: <PeopleIcon />,
          trend: 0,
        },
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
          link: "fiches-dessai/tout",
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
          title: "Taux de Complétion des OS",
          subTitle: "OS terminés",
          link: "list-OS",
          length: `${osCompletionRate.toFixed(1)}%`,
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

    if (user.roles.includes("Directeur")) {
      fetchDirectorStats();
    } else {
      setError("Accès non autorisé. Cette page est réservée au Directeur.");
      navigate("/login");
    }
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
          </Box>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          <Grid
            container
            spacing={3}
            sx={{
              mb: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
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
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
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
                            color={
                              stat.trend > 0 ? "success.main" : "error.main"
                            }
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
                    <Typography variant="body2">{stat.subTitle}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid
            container
            spacing={3}
            sx={{
              mb: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Grid item xs={12} md={12}>
              <Paper className="chart-container" sx={{ p: 3 }}>
                <Typography className="chart-title">
                  Évolution des Ordres de Service
                </Typography>
                <ResponsiveContainer width={700} height={500}>
                  <AreaChart data={chartData.osOverTime}>
                    <defs>
                      <linearGradient
                        id="colorCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#1976d2"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1976d2"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#388e3c"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#388e3c"
                          stopOpacity={0.1}
                        />
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
          </Grid>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default DirecteurDashboard;
