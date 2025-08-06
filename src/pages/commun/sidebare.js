import React, { useState, useEffect } from "react";
import styles from "../../styles/sidebare.module.css"; // Updated import
import axios from "axios";
import AuthService from "../../services/login_service";
import { useNavigate } from "react-router-dom";
import {
  FaElementor, 
  FaUserCog, 
  FaBuilding, 
  FaSlidersH, 
  FaFileAlt,
  FaList,
  FaFlask, 
  FaTasks, 
  FaHistory, 
  FaUser, 
  FaSignOutAlt, 
} from "react-icons/fa";

const Sidebar = ({ roles = [] }) => {
  // Default roles to an empty array
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [assigns, setAssigns] = useState([]); // Initialize as empty array
  const [unreadAssignments, setUnreadAssignments] = useState([]);
  const user = AuthService.getCurrentUser();
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  const handleClick = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const assignRes = await axios.get(`${API_BASE_URL}/api/assigns`, {
          withCredentials: true,
        });
        setAssigns(Array.isArray(assignRes.data) ? assignRes.data : []);
        if (user?.roles.includes("Operateur")) {
          setUnreadAssignments(
            assignRes.data
              .filter((asgn) => !asgn.read && asgn.userId === user.id)
              .map((assign) => assign.id)
          );
        }
      } catch (error) {
        console.error("Error :", error);
      }
    };

    fetchData();
  }, []);

  // Fetch unread assignments on login
  useEffect(() => {
    if (!user?.roles.includes("Operateur")) return;

    // Listen for new assignments via SSE
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/assigns/stream/${user.id}`
    );

    eventSource.addEventListener("assignment", async (event) => {
      const newAssign = JSON.parse(event.data);

      // Add the new assignment ID to unread assignments
      setUnreadAssignments((prev) => [...prev, newAssign.id]);

      // Refresh the assigns list by making a new API call
      try {
        const response = await axios.get(`${API_BASE_URL}/api/assigns`, {
          withCredentials: true,
        });
        setAssigns(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error refreshing assignments:", error);
      }
    });

    return () => eventSource.close();
  }, [user?.id]);

  const logout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const subtitles = [
    {
      title: "tableau de bord",
      link: "/Enregistrement-Dashboard",
      icon: <FaElementor className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["chargé_denregistrement"], // All roles can see this
    },
    {
      title: "tableau de bord",
      link: "/Directeur-dashboard",
      icon: <FaElementor className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Directeur", "manager"], // All roles can see this
    },
    {
      title: "tableau de bord",
      link: "/Chef_service-dashboard",
      icon: <FaElementor className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Chef_service"], // All roles can see this
    },
    {
      title: "tableau de bord",
      link: "/oper-dashboard",
      icon: <FaElementor className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Operateur"], // All roles can see this
    },
    {
      title: "créer un OS",
      link: "/create-os",
      icon: <FaFileAlt className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["chargé_denregistrement"], // Both super admin and admin can see this
    },
    {
      title: "liste des OS",
      link: "/list-OS",
      icon: <FaList className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["chargé_denregistrement"], // Both super admin and admin can see this
    },
    {
      title: "liste des Fiches d'essais",
      link: "/fiches-dessai",
      icon: <FaList className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Sous_directeur"], // Both super admin and admin can see this
    },
    {
      title: "gestion des utilisateurs",
      link: "#subtitle1",
      icon: <FaUserCog className={styles.menuIcon} />,
      children: [
        { name: "liste des utilisateurs", link: "/list-utilisateurs" },
        { name: "neveaux utilisateur", link: "/ajoute-utilisateur" },
      ],
      allowedRoles: ["Directeur", "manager"], // Only admin and manager can see this
    },
    {
      title: "gestion des Directions",
      link: "/create-SousDirection",
      icon: <FaBuilding className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Directeur"], // Only admin can see this
    },
    {
      title: "Tests",
      link: "#subtitle4",
      icon: <FaFlask className={styles.menuIcon} />,
      children: [
        { name: "Crée un Test/Essei", link: `/test/${0}` },
        { name: "Crée un Set de Test", link: `/test-set/${0}` },
        { name: "Liste des tests", link: "/tests-list" },
      ],
      allowedRoles: ["Chef_service"],
    },
    {
      title: "Assign",
      link: "#subtitle3",
      icon: <FaTasks className={styles.menuIcon} />,
      children: [
        { name: "Liste des assignments", link: "/assigns-list" },
        { name: "Liste des fiches d'essais", link: "/esseis-list" },
      ],
      allowedRoles: ["Chef_service"],
    },
    {
      title: "Historique des modifications",
      link: "/op-histo",
      icon: <FaHistory className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Chef_service"],
    },
    {
      title: (
        <div className={styles.notificationWrapper}>
          <span>list des tests</span>
          {unreadAssignments.length > 0 && (
            <span className={styles.notificationBadge}>
              {unreadAssignments.length}
            </span>
          )}
        </div>
      ),
      link: "/oper-assigned-list",
      icon: <FaTasks className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Operateur"],
    },

    {
      title: "Mon Profil",
      link: `/utilisateur_profil/${user?.id}`,
      icon: <FaUser className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["manager", "user"], // All roles can see this
    },

    {
      title: "personnaliser template",
      link: `/document-upload`,
      icon: <FaSlidersH className={styles.menuIcon} />,
      children: [],
      allowedRoles: ["Directeur", "chargé_denregistrement"], // All roles can see this
    },
    {
      title: "Déconnexion",
      link: "#logout",
      icon: <FaSignOutAlt className={styles.menuIcon} />,
      children: [],
      action: logout,
      allowedRoles: [], // Show to all
    },
  ];
  // Filter subtitles based on user roles
  const filteredSubtitles = subtitles.filter((subtitle) => {
    // If no allowedRoles specified, show to all
    if (!subtitle.allowedRoles || subtitle.allowedRoles.length === 0)
      return true;

    // Check if user has any of the allowed roles
    return user?.roles.some((role) => subtitle.allowedRoles.includes(role));
  });

  return (
    <nav className={styles.menu} tabIndex="0">
      <div className={styles.smartphoneMenuTrigger}></div>
      <header className={styles.avatar}>
        <img
          src={user?.profilePhoto || "/images/defaultprofilephoto.jpeg"}
          alt="Profile"
          onError={(e) => {
            e.target.src = "/images/defaultprofilephoto.jpeg";
          }}
        />
        <h2>{user?.username || "User"}</h2>
      </header>

      {/* Replace the ul with our subtitles list */}
      <ul className={styles.sidebarMenu}>
        {filteredSubtitles.map((subtitle, index) => (
          <React.Fragment key={index}>
            <li
              tabIndex="0"
              className={`${styles.sidebarItem} ${
                expanded === index ? styles.expanded : ""
              }`}
              onClick={() => {
                if (subtitle.action) {
                  subtitle.action();
                } else if (subtitle.children.length > 0) {
                  handleClick(index);
                } else {
                  navigate(subtitle.link);
                }
              }}
            >
              <div className={styles.sidebarItemContent}>
                {subtitle.icon}
                <span>{subtitle.title}</span>
                {subtitle.children.length > 0 && (
                  <span className={styles.dropdownArrow}>
                    {expanded === index ? "▼" : "▶"}
                  </span>
                )}
              </div>
            </li>
            {/* Render children if expanded */}
            {expanded === index && subtitle.children.length > 0 && (
              <ul className={styles.submenu}>
                {subtitle.children.map((child, childIndex) => (
                  <li
                    key={childIndex}
                    className={styles.submenuItem}
                    onClick={() => navigate(child.link)}
                  >
                    {child.name}
                  </li>
                ))}
              </ul>
            )}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
