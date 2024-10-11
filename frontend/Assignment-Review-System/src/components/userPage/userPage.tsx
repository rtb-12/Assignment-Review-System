import React from "react";
import Leaderboard from "./leaderboard";
import { TabsUser } from "./Tabs";

const UserPage = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Leaderboard on the left side */}
      <div className="w-1/4 h-full bg-gray-100 dark:bg-gray-800">
        <Leaderboard />
      </div>
      {/* Main Content with Tabs */}
      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50">
          User Dashboard
        </h1>
        {/* Tabs with content inside */}
        <TabsUser />
      </div>
    </div>
  );
};

export default UserPage;
