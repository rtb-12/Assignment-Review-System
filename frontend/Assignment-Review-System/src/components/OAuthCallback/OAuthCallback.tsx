import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code) {
      // Send the code to the backend to exchange for tokens
      fetch(`http://localhost:8000/callback/?code=${code}&state=${state}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are included in the request
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.access && data.refresh) {
            // Store tokens in cookies
            Cookies.set("access_token", data.access);
            Cookies.set("refresh_token", data.refresh);
            Cookies.set("csrf_token", data.csrf_token);

            // Redirect to workspace
            navigate("/workspace");
          } else {
            console.error("Failed to obtain tokens:", data);
          }
        })
        .catch((error) => {
          console.error("Error during OAuth callback:", error);
        });
    }
  }, [navigate]);

  return <div>Loading...</div>;
};

export default OAuthCallback;
