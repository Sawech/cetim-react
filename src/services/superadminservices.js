import axios from "axios";

const API_URL = "https://cetim-spring.onrender.com/api/superadmin/";

const adduser = (user) => {
  return axios
    .post(API_URL + "newuser", user, {
      withCredentials: true, 
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("Error:", error.response ? error.response.data : error.message);
      throw error;
    });
};

const fetchUser = async (userId) => {
  return axios
    .get(API_URL + 'getusers/' + userId, {
      withCredentials: true,
    })
    .then((response) => {
      return response.data; // Return the data directly
    })
    .catch((error) => {
      console.error("Error:", error.response ? error.response.data : error.message);
      throw error;
    });
};

const updateuser = (user) => {
  return axios
    .post(API_URL + "newuser/${userId}", user, {
      withCredentials: true, 
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("Error:", error.response ? error.response.data : error.message);
      throw error;
    });
};

const DeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`); // Call the API to delete the user
        //setUsers(users.filter(user => user.id !== userId)); // Update the local state
      } catch (err) {
        //setError(err.message); // Handle errors
      }
    }
  };

const superadminservices = {
  adduser,
  updateuser,
  fetchUser,
  DeleteUser
};

export default superadminservices;