import axios from "axios";

const API_URL = "https://cetim-spring.onrender.com/api/auth/";

const login = (username, password) => {
  return axios
    .post(API_URL + "signin", {
      username,
      password,
    }, {
      withCredentials: true, 
    })
    .then((response) => {
      if (response.data.username) {
        // Store user information in localStorage
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
    localStorage.removeItem("user");
    return axios.post(API_URL + "signout", {}, {
      withCredentials: true
    }).then((response) => {
      return response.data;
    });
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user"));
};

const AuthService = {
    login,
    logout,
    getCurrentUser
};

export default AuthService;