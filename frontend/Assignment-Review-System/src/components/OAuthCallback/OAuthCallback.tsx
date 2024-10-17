import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { login } from "../../features/auth/authSlice";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code) {
      fetch(`http://localhost:8000/callback/?code=${code}&state=${state}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.access && data.refresh) {
            Cookies.set("access", data.access);
            Cookies.set("refresh", data.refresh);
            console.log(JSON.stringify(data));
            dispatch(
              login({
                user_id: data.user_id,
                username: data.name,
                email: data.email,
                profilePic: data.profile_image,
              })
            );

            navigate("/workspace");
          } else {
            console.error("Failed to obtain tokens:", data);
          }
        })
        .catch((error) => {
          console.error("Error during OAuth callback:", error);
        });
    }
  }, [navigate, dispatch]);

  return <div>Loading...</div>;
};

export default OAuthCallback;
