import React, { useState } from "react";
import {
  IconMenu2,
  IconX,
  IconUser,
  IconLogout,
  IconFilePlus,
  IconCheck,
  IconUsers,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { logout } from "../../features/auth/authSlice";
import Cookies from "js-cookie";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const workspaceId = useSelector(
    (state: RootState) => state.workspace.workspaceId
  );
  const isAdmin = useSelector((state: RootState) => state.workspace.isAdmin);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOnUserProfile = () => {
    if (workspaceId) {
      navigate(`/profile`);
    } else {
      console.error("No workspace ID found");
    }
  };

  const handleClickOnGroupManager = () => {
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/groupManagement`);
    } else {
      console.error("No workspace ID found");
    }
  };

  const handleCreateAssignmentClick = () => {
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/create-assignment`);
    } else {
      console.error("No workspace ID not found");
    }
  };

  const handleReviewAssignmentClick = () => {
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/assignment-dashboard`);
    } else {
      console.error("No workspace ID not found");
    }
  };

  const handleLogout = () => {
    Cookies.remove("access");
    Cookies.remove("refresh");
    Cookies.remove("csrftoken");
    dispatch(logout());
    navigate("/");
  };

  return (
    <div>
      {!isOpen && (
        <div className="top-4 left-4 z-50">
          <IconMenu2
            className="h-6 w-6 cursor-pointer"
            onClick={toggleSidebar}
          />
        </div>
      )}

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

        <ul className="p-4 space-y-4">
          <li
            className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
            role="button"
            onClick={handleClickOnUserProfile}
          >
            <IconUser className="h-5 w-5 mr-3" />
            <span className="text-base">Profile</span>
          </li>
          <li
            className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 cursor-pointer"
            role="button"
            onClick={handleCreateAssignmentClick}
          >
            <IconFilePlus className="h-5 w-5 mr-3" />
            <span className="text-base">Create Assignment</span>
          </li>
          <li
            className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
            role="button"
            onClick={handleReviewAssignmentClick}
          >
            <IconCheck className="h-5 w-5 mr-3" />
            <span className="text-base">Review Assignment</span>
          </li>
          {isAdmin && (
            <li
              className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
              role="button"
              onClick={handleClickOnGroupManager}
            >
              <IconUsers className="h-5 w-5 mr-3" />
              <span className="text-base">Manage Groups</span>
            </li>
          )}
        </ul>

        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            className="flex items-center justify-start w-full py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
            onClick={handleLogout}
          >
            <IconLogout className="h-5 w-5 mr-3" />
            <span className="text-base">Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;
