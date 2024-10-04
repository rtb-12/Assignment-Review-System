"use client";

import { Tabs } from "../ui/tabs";
import RevieweeTable from "./RevieweeTable";

export function TabsAssignmentReview() {
  const tabs = [
    {
      title: "Reviewee",
      value: "Reviewee",
      content: (
        <div className="w-full h-full relative overflow-x-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
          <p className="pb-4">Reviewee</p>
          <div className="flex flex-row gap-4 overflow-x-auto flex-nowrap">
            {/* Horizontal scrollable cards */}
            <RevieweeTable />
          </div>
        </div>
      ),
    },
    {
      title: "Notifications",
      value: "Notifications",
      content: (
        <div className="w-full h-full relative overflow-x-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
          <p className="pb-4">Notifications</p>
          <div className="flex flex-row gap-4 overflow-x-auto flex-nowrap">
            {/* Horizontal scrollable cards */}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="h-[20rem] md:h-[40rem] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start my-[1rem]">
      <Tabs tabs={tabs} />
    </div>
  );
}
