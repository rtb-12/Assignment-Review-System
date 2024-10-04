import React from "react";
import { TabsAssignmentReview } from "./Tabs";
import GlobalChatAssignment from "../GlobalChatAssignment/ChatBox";

const AssignmentReviewerCard = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content with Tabs */}
      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50">
          Assignment's Name
        </h1>
        {/* Tabs with content inside */}
        <div className="flex">
          <TabsAssignmentReview />
          <GlobalChatAssignment />
        </div>
      </div>
    </div>
  );
};

export default AssignmentReviewerCard;
