import React, { useState } from "react";
import {
  IconMenu2,
  IconX,
  IconUser,
  IconLogout,
  IconFilePlus,
  IconCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Toggle button for the sidebar */}
      {!isOpen && (
        <div className=" top-4 left-4 z-50">
          <IconMenu2
            className="h-6 w-6 cursor-pointer"
            onClick={toggleSidebar}
          />
        </div>
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={isOpen ? { x: 0, opacity: 1 } : { x: "-100%", opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 30,
          opacity: { duration: 0.3 },
        }}
        className={`fixed top-0 left-0 w-72 h-full bg-gray-100 dark:bg-gray-800 shadow-lg z-40 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="flex justify-between items-center p-6 bg-gray-200 dark:bg-gray-700">
          <h2 className="text-xl font-semibold">Assignly</h2>
          <IconX className="h-6 w-6 cursor-pointer" onClick={toggleSidebar} />
        </div>

        {/* Menu items */}
        <ul className="p-4 space-y-4">
          {/* List items with improved spacing, padding, and font size */}
          <li className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200">
            <IconUser className="h-5 w-5 mr-3" />
            <span className="text-base">Profile</span>
          </li>
          <li className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200">
            <IconFilePlus className="h-5 w-5 mr-3" />
            <span className="text-base">Create Assignment</span>
          </li>
          <li className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200">
            <IconCheck className="h-5 w-5 mr-3" />
            <span className="text-base">Review Assignment</span>
          </li>
        </ul>

        {/* Sign Out button at the bottom */}
        <div className="absolute bottom-4 left-0 w-full px-4">
          <button className="flex items-center justify-start w-full py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200">
            <IconLogout className="h-5 w-5 mr-3" />
            <span className="text-base">Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;
