import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/LoginPage.css";
import AuthService from "../../services/login_service";
import backgroundVideo from "../../components/labo_vid.mp4"; // Adjust the path to your video
import { Link } from "react-router-dom";


export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const form = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    AuthService.logout();
    AuthService.login(username, password).then(
      () => {
        const user = AuthService.getCurrentUser();
        switch (user.roles[0]) {
          case "Directeur":
            navigate("/Directeur-dashboard");
            break;
          case "chargé_denregistrement":
            navigate("/Enregistrement-Dashboard");
            break;
          case "Sous_directeur":
            navigate("/Sous_directeur-dashboard");
            break;
          case "Chef_service":
            navigate("/Chef_service-dashboard");
            break;
          case "Operateur":
            navigate("/oper-dashboard");
            break;
          default:
            setMessage(user.roles[0]);
            setLoading(false);
        }
      },
      (error) => {
        console.log("La connexion a échoué:", error); // Debug
        alert("Error login!");
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        setLoading(false);
        setMessage(resMessage);
      }
    );
  };

  useEffect(() => {
    document.body.classList.add("login-page");
    const card = document.querySelector(".login-card");
    card.classList.add("fade-in");

    return () => {
      document.body.classList.remove("login-page"); // Clean up on unmount
    };
  }, []);

  return (
    <div className="login-container">
      {/* Add video element */}
      <video autoPlay loop muted className="background-video">
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="login-card">
        <div className="cetim-logo"></div>
        <h2 className="login-title"></h2>
        <form onSubmit={handleSubmit} ref={form}>
          <div className="input-group">
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Entrez votre nom d'utilisateur"
              required
            />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Chargement..." : "Connexion"}
          </button>
          {message && <div className="message">{message}</div>}
        </form>
        <p className="signup-text">
          Vous n'avez pas de compte (for test only)?{" "}
          <Link to="/ajoute-utilisateur" className="signup-link">
            Inscrivez-vous ici
          </Link>
        </p>
      </div>
    </div>
  );
}
