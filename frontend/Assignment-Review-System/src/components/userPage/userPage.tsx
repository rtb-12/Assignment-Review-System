import React, { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import Leaderboard from "./leaderboard";
import { TabsUser } from "./Tabs";
import { useDispatch, useSelector } from "react-redux";
import {
  setWorkspaceId,
  setIsAdmin,
} from "../../features/workspace/workspaceSlice";
import { useParams } from "react-router-dom";
import { Button } from "../ui/button";
import axios from "axios";
import Cookies from "js-cookie";
import Modal from "../ui/Modal";
import { RootState } from "../../store/store";

const UserPage = () => {
  const dispatch = useDispatch();
  const { workspaceId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const isAdmin = useSelector((state: RootState) => state.workspace.isAdmin);
  const [workspaceNotFound, setWorkspaceNotFound] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      dispatch(setWorkspaceId(workspaceId));
    }
  }, [dispatch, workspaceId]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/access/${workspaceId}/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );

        if (response.status === 200 && response.data.detail === "Admin view") {
          dispatch(setIsAdmin(true));
        } else {
          dispatch(setIsAdmin(false));
        }
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status === 404
        ) {
          setWorkspaceNotFound(true);
        } else {
          console.error("Error checking admin status:", error);
          dispatch(setIsAdmin(false));
        }
      }
    };

    if (workspaceId) {
      checkAdminStatus();
    }
  }, [workspaceId, dispatch]);

  if (workspaceNotFound) {
    return <div>Workspace not found.</div>;
  }

  const handleGenerateInviteToken = async () => {
    setIsModalOpen(true);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/workspace/generate-invitation/${workspaceId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      setInviteToken(data.invitation_token);
    } catch (error) {
      console.error("Error fetching invite Token:", error);
      setInviteToken("Error fetching Token");
    }
  };

  return (
    <div>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-1/4 h-full bg-gray-100 dark:bg-gray-800">
          <Leaderboard />
        </div>

        <div className="flex-1 p-4">
          <div className="flex justify-between ">
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50">
              User Dashboard
            </h1>

            {isAdmin && (
              <Button onClick={handleGenerateInviteToken}>
                Generate Invitation Token
              </Button>
            )}
          </div>

          <TabsUser />
          {isModalOpen && (
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
              <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
                  Invitation Token
                </h2>
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300 font-mono">
                    {inviteToken}
                  </span>
                  <Button
                    onClick={() => navigator.clipboard.writeText(inviteToken)}
                    className="ml-2 bg-blue-500 hover:bg-blue-600 text-white flex items-center px-3 py-1 rounded-md"
                  >
                    <FiCopy className="mr-2" /> Copy
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
