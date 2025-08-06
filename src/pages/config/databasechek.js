import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CheckDatabase = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("https://cetim-spring.onrender.com/api/database/check")
            .then((response) => {
                if (response.data.status === "connected") {
                    navigate("/login");  // Redirect to login page
                } else {
                    navigate("/database-setup");  // Redirect to database setup page
                }
            })
            //.catch(() => navigate("/database-setup"))
            .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) return <p>Checking database...</p>;

    return null;
};

export default CheckDatabase;


