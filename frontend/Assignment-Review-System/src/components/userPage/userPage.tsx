import React, { useEffect } from "react";
import Leaderboard from "./leaderboard";
import { TabsUser } from "./Tabs";
import { useDispatch } from "react-redux";
import { setWorkspaceId } from "../../features/workspace/workspaceSlice";
import { useParams } from "react-router-dom";

const UserPage = () => {
  const dispatch = useDispatch();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  useEffect(() => {
    if (workspaceId) {
      dispatch(setWorkspaceId(workspaceId));
    }
  }, [dispatch, workspaceId]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Leaderboard on the left side */}
      <div className="w-1/4 h-full bg-gray-100 dark:bg-gray-800">
        <Leaderboard />
      </div>
      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50">
          User Dashboard
        </h1>
        <TabsUser />
      </div>
    </div>
  );
};

export default UserPage;
