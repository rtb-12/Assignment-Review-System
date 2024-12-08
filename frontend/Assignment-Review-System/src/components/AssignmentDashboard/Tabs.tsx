"use client";

import { useEffect, useState } from "react";
import { Tabs } from "../ui/tabs";
import { AssignmentCard } from "./AssignmentCard";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";

const fetchIssuedAssignments = async (workspaceId) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/workspace/${workspaceId}/assignments/`,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("access")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching issued assignments:", error);
    return [];
  }
};

export function TabsAssignmentDashboard() {
  const { workspaceId } = useParams();
  const [issuedAssignments, setIssuedAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getIssuedAssignments = async () => {
      setIsLoading(true);
      const data = await fetchIssuedAssignments(workspaceId);
      setIssuedAssignments(data);
      setIsLoading(false);
    };

    getIssuedAssignments();
  }, [workspaceId]);

  const tabs = [
    {
      title: "Issued Assignments",
      value: "Issued Assignments",
      content: (
        <div className="w-full h-full relative overflow-x-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
          <p className="pb-4">Issued Assignments</p>
          {isLoading ? (
            <p>Loading assignments...</p>
          ) : (
            <div className="flex flex-row gap-4 overflow-x-auto flex-nowrap">
              {issuedAssignments.length > 0 ? (
                issuedAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.assignment_id}
                    assignment={assignment}
                  />
                ))
              ) : (
                <p>No assignments found.</p>
              )}
            </div>
          )}
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
            {/* Add notification content here */}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="h-[20rem] md:h-[40rem] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start my-[1rem]">
      {/* Pass issuedAssignments as key to Tabs */}
      <Tabs key={issuedAssignments.length} tabs={tabs} />
    </div>
  );
}
