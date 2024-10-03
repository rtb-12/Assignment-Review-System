import React from "react";

import { TabsDemo } from "./Tabs";

const AssignmentdashboardPage = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content with Tabs */}
      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50">
          Assignment's Dashboard
        </h1>
        {/* Tabs with content inside */}
        <TabsDemo />
      </div>
    </div>
  );
};

export default AssignmentdashboardPage;
