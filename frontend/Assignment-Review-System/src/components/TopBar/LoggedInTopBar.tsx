import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Sun, Moon, BadgeCheck } from "lucide-react";
import Sidebar from "./SideBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoggedInTopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    <div className="flex justify-between items-center p-4 bg-lightBg text-lightText dark:bg-darkBg dark:text-darkText w-full">
      {/* Sidebar */}
      <div className="flex flex-row items-center space-x-2 gap-1">
        <Sidebar />
        <div className=" flex gap-2">
          <BadgeCheck className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-semibold">Assignly</span>
        </div>
      </div>

      {/* Logo and User Profile */}
      <div className="flex items-center space-x-6">
        <Button
          onClick={toggleDarkMode}
          className="p-2 bg-transparent border-none"
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 text-yellow-400" />
          ) : (
            <Moon className="h-6 w-6 text-gray-800 dark:text-white" />
          )}
        </Button>

        <div className="flex items-center space-x-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer">
          <img
            src={user?.profilePic || "https://via.placeholder.com/40x40"}
            alt={user?.username || "User"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {user?.username || "User"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoggedInTopBar;
