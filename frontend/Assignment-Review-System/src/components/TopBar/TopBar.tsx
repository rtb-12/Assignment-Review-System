import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Sun, Moon, BadgeCheck } from "lucide-react"; // Icons for light/dark mode toggle
import { useNavigate } from "react-router-dom";

const TopBar = () => {
  const navigate = useNavigate();
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
      {/* Logo and Name */}
      <div className="flex items-center space-x-2">
        <BadgeCheck className="h-6 w-6 text-blue-500" />
        <span className="text-xl font-bold">Assignly</span>
      </div>

      {/* Toggle Button for Dark/Light Mode */}
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

        {/* Sign Up and Login Buttons */}
        <Button
          variant="default"
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </Button>
        <Button
          variant="default"
          className="bg-transparent border border-white text-grey hover:bg-white hover:text-gray-800"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </div>
    </div>
  );
};

export default TopBar;
