import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import AuthService from "../../../services/login_service";
import Sidebar from "../../commun/sidebare";
import "../../../styles/test.css";

const TestSetCreation = () => {
  const { id } = useParams();
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [testName, setTestName] = useState("");
  const [testCode, setTestCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [navigate, currentUser]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/tests/direction/${currentUser.service}`
        );
        setAvailableTests(
          response.data.filter(
            (test) => test.isPrimaryTest && !test.complexeTest
          )
        );
        if (id === "0") return;

        const selected = await axios.get(
          `${API_BASE_URL}/api/tests/${id}`
        );
        setTestCode(selected.data.testCode);
        setTestName(selected.data.testName);
        setSelectedTests(selected.data.subTestIds);
      } catch (error) {
        console.error("Error fetching tests:", error);
      }
    };
    fetchTests();
  }, [currentUser.service]);

  const handleTestSelection = (testId) => {
    setSelectedTests((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  const checkTestCodeUnique = async (code) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/tests/check-code?code=${code}`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking test code:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isUnique = await checkTestCodeUnique(testCode);
    if (id === "0" && !isUnique) {
      alert("Test code must be unique!");
      return;
    }

    if (!testCode.trim()) {
      alert("Please enter a test code");
      return;
    }

    if (selectedTests.length === 0) {
      alert("Please select at least one test");
      return;
    }
    console.log(selectedTests);
    setIsLoading(true);
    const testData = {
      service: currentUser.service,
      testCode: testCode,
      testName: testName,
      isPrimaryTest: true,
      complexeTest: true,
      subTestIds: selectedTests,
    };

    try {
      if (id === "0") {
        const response = await axios.post(
          `${API_BASE_URL}/api/tests`,
          testData
        );
        alert("Set created successfully!");
        navigate(`/test-set/${response.data.id}`);
      } else {
        await axios.put(`${API_BASE_URL}/api/tests/${id}`, testData);
        alert("Test saved successfully!");
      }
    } catch (error) {
      console.error("Error saving test:", error);
      alert("Failed to save test.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-container">
      <Sidebar roles={currentUser ? currentUser.roles : []} />
      <div className="test-content">
        <div className="test-header">
          {id === "0" ? (
            <h2>Créer Un Ensemble De Test</h2>
          ) : (
            <h2>Modifier L'ensemble De Test</h2>
          )}
        </div>

        <div className="test-form">
          <div className="form-row">
            <div className="form-group">
              <label>Test Description</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter Test Description"
              />
            </div>
            <div className="form-group">
              <label>Test Code</label>
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="Enter Test Code"
              />
            </div>
          </div>

          <div className="test-selection">
            <label>Select Tests</label>
            {availableTests.length === 0 ? (
              <div>You don't have any tests yet. Create some tests first.</div>
            ) : (
              <div className="test-list">
                {availableTests.map((test) => (
                  <div
                    key={test.id}
                    className={`test-item ${
                      selectedTests.includes(test.id) ? "selected" : ""
                    }`}
                    onClick={() => handleTestSelection(test.id)}
                  >
                    <div className="test-item-content">
                      <span>{test.testCode}</span>
                      {selectedTests.includes(test.id) && <span>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTests.length > 0 && (
            <div className="selected-tests-preview">
              <h5>Selected Tests ({selectedTests.length})</h5>
              <div className="selected-tests-list">
                {availableTests
                  .filter((test) => selectedTests.includes(test.id))
                  .map((test) => (
                    <span key={test.id} className="selected-test-tag">
                      {test.testCode}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-button"
              onClick={handleSubmit}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : id === "0" ? (
                "Create Set"
              ) : (
                "Update Set"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSetCreation;
