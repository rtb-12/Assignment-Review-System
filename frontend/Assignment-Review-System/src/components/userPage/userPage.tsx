import React from "react";
import Leaderboard from "./leaderboard";
import { Button } from "../ui/moving-border";
import { CardDemo } from "./AssignmentCard";

const UserPage = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Leaderboard on the left side */}
      <div className="w-1/4 h-full bg-gray-100 dark:bg-gray-800">
        <Leaderboard />
      </div>
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">
          User Dashboard
        </h1>
        {/* Add your main content here */}
        <div className="mb-8">
          <Button
            borderRadius="1.75rem"
            containerClassName="w-1/3"
            className="text-2xl font-bold py-2 px-4 bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
          >
            Ongoing Assignments
          </Button>
        </div>
        {/* Assignment Cards */}
        <div className="max-w-[44rem] overflow-x-auto">
          <div className="flex space-x-4">
            <CardDemo />
            <CardDemo />
            <CardDemo />
            <CardDemo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
