import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthService from "../../../services/login_service";
import Sidebar from "../../commun/sidebare";
import TestCreation from "./testcreation";
import "../../../styles/test.css";

const Test = () => {
  const [activeTab, setActiveTab] = useState("test");
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [navigate, currentUser]);

  return (
    <div className="test-container">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="test-content">
        {activeTab === "essei" ?(
          <TestCreation
            id={id}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
        ) : (
          <TestCreation
            id={id}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
        )}
      </div>
    </div>
  );
};

export default Test;