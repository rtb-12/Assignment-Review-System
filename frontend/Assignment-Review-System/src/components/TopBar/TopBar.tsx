// frontend/Assignment-Review-System/src/components/TopBar/TopBar.tsx

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Sun, Moon, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const TopBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="flex justify-between items-center p-4 bg-lightBg text-lightText dark:bg-darkBg dark:text-darkText">
      <div className="flex items-center space-x-2">
        <BadgeCheck className="h-6 w-6 text-blue-500" />
        <span className="text-xl font-bold">Assignly</span>
      </div>
      <div className="flex items-center space-x-4">
        <Button
          onClick={toggleDarkMode}
          className="p-2 bg-transparent border-none"
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 text-yellow-400" />
          ) : (
            <Moon className="h-6 w-6 text-gray-800" />
          )}
        </Button>
        {isAuthenticated ? (
          <div className="flex items-center space-x-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer">
            <img
              src={user?.profilePic || "https://via.placeholder.com/40x40"}
              alt={user?.username || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {user?.username || "User"}
            </span>
            <Button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Logout
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={() => navigate("/signup")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Sign Up
            </Button>
            <Button
              onClick={() => navigate("/login")}
              className="bg-transparent border border-white text-grey hover:bg-white hover:text-gray-800"
            >
              Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;
