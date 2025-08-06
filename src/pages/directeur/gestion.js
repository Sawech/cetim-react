import React, { useState, useEffect } from "react";
import axios from "axios";
import AuthService from "../../services/login_service";

const RemoveGestion = () => {
  const [dropdown, setDropdown] = useState({
    dispatcherId: AuthService.getCurrentUser()?.id || null,
    test: "",
    operateur: null,
    testSearchQuery: "",
    operateurSearchQuery: "",
    isTestDropdownOpen: false,
    isOperateurDropdownOpen: false,
  });

  const [testsList, setTestsList] = useState([]);
  const [operateursList, setOperateursList] = useState([]);
      const API_BASE_URL = process.env.REACT_APP_API_URL || "https://cetim-spring.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, operateursRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/tests`),
          axios.get(`${API_BASE_URL}/api/users`),
        ]);

        setTestsList(testsRes.data.filter(test => test.isPrimaryTest));
        setOperateursList(operateursRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Close all dropdowns when clicking anywhere in the document
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdown(prev => ({
        ...prev,
        isTestDropdownOpen: false,
        isOperateurDropdownOpen: false
      }));
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownType) => (e) => {
    e.stopPropagation();
    setDropdown(prev => ({
      ...prev,
      isTestDropdownOpen: dropdownType === "test" ? !prev.isTestDropdownOpen : false,
      isOperateurDropdownOpen: dropdownType === "operateur" ? !prev.isOperateurDropdownOpen : false,
      [`${dropdownType}SearchQuery`]: ""
    }));
  };

  const removeTest = async () => {
    if (!dropdown.test.id) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/tests/${dropdown.test.id}`);
      setTestsList(prevTests => prevTests.filter(test => test.id !== dropdown.test.id));
      setDropdown({test: "" });
      alert("Test removed successfully");
    } catch (error) {
      console.error("Error removing test:", error);
      alert("Failed to remove test");
    }
  };

  const removeOperateur = async () => {
    if (!dropdown.operateur.id) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/users/${dropdown.operateur.id}`);
      setOperateursList(prevOperateurs => prevOperateurs.filter(operateur => operateur.id !== dropdown.operateur.id));
      setDropdown({operateur: "" });
      alert("Operateur removed successfully");
    } catch (error) {
      console.error("Error removing operateur:", error);
      alert("Failed to remove operateur");
    }
  };

  const handleSelect = (type, value) => {
    setDropdown(prev => ({
      ...prev,
      [type]: value,
      isTestDropdownOpen: false,
      isOperateurDropdownOpen: false
    }));
  };

  const handleSearchChange = (type, e) => {
    setDropdown(prev => ({
      ...prev,
      [`${type}SearchQuery`]: e.target.value
    }));
  };

  // Filter functions
  const filterTests = (query) => 
    testsList.filter(p => p.id.toString().includes(query));
  const filterOperateurs = (query) => 
    operateursList.filter(o => 
      `${o.firstName || ''} ${o.lastName || ''}`.toLowerCase().includes(query.toLowerCase()) || 
      o.username.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">Remove Management</h3>
        </div>
        <div className="card-body">
          {/* Test Dropdown */}
          <div className="mb-4">
            <h4 className="mb-3">Select Test</h4>
            <div className="d-flex align-items-center">
              <div className="dropdown w-100 me-2">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                  onClick={toggleDropdown("test")}
                >
                  {dropdown.test?.name || "Select a Test"}
                </button>
                {dropdown.isTestDropdownOpen && (
                  <div className="dropdown-menu show w-100 p-0">
                    <div className="p-2">
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Search tests..."
                        value={dropdown.testSearchQuery}
                        onChange={(e) => handleSearchChange("test", e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-divider m-0"></div>
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {filterTests(dropdown.testSearchQuery).map((test) => (
                        <button
                          key={test.id}
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect("test", { id: test.id, name: test.testName });
                          }}
                        >
                          {test.testName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {dropdown.test && (
                <button
                  onClick={removeTest}
                  className="btn btn-danger"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Operateur Dropdown */}
          <div className="mb-4">
            <h4 className="mb-3">Select User</h4>
            <div className="d-flex align-items-center">
              <div className="dropdown w-100 me-2">
                <button
                  className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                  onClick={toggleDropdown("operateur")}
                >
                  {dropdown.operateur
                    ? `${dropdown.operateur.firstName} ${dropdown.operateur.lastName}`
                    : "Select an Operateur"}
                </button>
                {dropdown.isOperateurDropdownOpen && (
                  <div className="dropdown-menu show w-100 p-0">
                    <div className="p-2">
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Search operateurs..."
                        value={dropdown.operateurSearchQuery}
                        onChange={(e) => handleSearchChange("operateur", e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-divider m-0"></div>
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {filterOperateurs(dropdown.operateurSearchQuery).map((op) => (
                        <button
                          key={op.id}
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect("operateur", { id: op.id, firstName: op.firstName, lastName: op.lastName });
                          }}
                        >
                          {op.firstName} {op.lastName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {dropdown.operateur && (
                <button
                  onClick={removeOperateur}
                  className="btn btn-danger"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveGestion;