// frontend/Assignment-Review-System/src/components/TopBar/LoggedInTopBar.tsx

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Sun, Moon, BadgeCheck } from "lucide-react";
import Sidebar from "./SideBar";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useNavigate } from "react-router-dom";

const LoggedInTopBar = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const workspaceId = useSelector(
    (state: RootState) => state.workspace.workspaceId
  );
  const navigate = useNavigate();

  const handleClickOnLogo = () => {
    if (user) {
      navigate(`workspace/${workspaceId}`);
    } else {
      navigate("/");
    }
  };
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
      <div className="flex flex-row items-center space-x-2 gap-1">
        <Sidebar />
        <div className=" flex gap-2" onClick={handleClickOnLogo}>
          <BadgeCheck className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-semibold cursor-pointer">Assignly</span>
        </div>
      </div>

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
            src={user?.profile_pic || "https://via.placeholder.com/40x40"}
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
