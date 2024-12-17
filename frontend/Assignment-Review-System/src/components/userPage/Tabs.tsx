"use client";

import { useEffect, useState } from "react";
import { Tabs } from "../ui/tabs";
import { AssignmentCard } from "./AssignmentCard";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

const fetchOngoingAssignments = async (workspaceId: string) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/ongoing-assignments/`,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("access")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching ongoing assignments:", error);
    return [];
  }
};

const fetchDeadlineCrossedAssignments = async (workspaceId: string) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/crossed-deadline-assignments/`,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("access")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching deadline crossed assignments:", error);
    return [];
  }
};

const fetchCompletedAssignments = async (workspaceId: string) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/completed-assignments/`,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("access")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching completed assignments:", error);
    return [];
  }
};

export function TabsUser() {
  interface Assignment {
    assignment_id: number;
    assignment_name: string;
    deadline: string;
  }

  const workspaceId = useSelector(
    (state: RootState) => state.workspace.workspaceId
  );
  const [isLoading, setIsLoading] = useState(true);
  const [ongoingAssignments, setOngoingAssignments] = useState<Assignment[]>(
    []
  );
  const [deadlineCrossedAssignments, setDeadlineCrossedAssignments] = useState<
    Assignment[]
  >([]);
  const [completedAssignments, setCompletedAssignments] = useState<
    Assignment[]
  >([]);

  // Combined useEffect for all assignment fetches
  useEffect(() => {
    const fetchAllAssignments = async () => {
      if (!workspaceId) return;

      setIsLoading(true);
      try {
        const [ongoing, deadlineCrossed, completed] = await Promise.all([
          fetchOngoingAssignments(workspaceId),
          fetchDeadlineCrossedAssignments(workspaceId),
          fetchCompletedAssignments(workspaceId),
        ]);

        setOngoingAssignments(ongoing);
        setDeadlineCrossedAssignments(deadlineCrossed);
        setCompletedAssignments(completed);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAssignments();
  }, [workspaceId]);

  const renderAssignments = (assignments: Assignment[], title: string) => (
    <div className="w-full h-full relative overflow-x-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
      <p className="pb-4">{title}</p>
      {isLoading ? (
        <p>Loading assignments...</p>
      ) : (
        <div className="flex flex-row gap-4 overflow-x-auto flex-nowrap">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.assignment_id}
                assignment={assignment}
              />
            ))
          ) : (
            <p>No assignments found</p>
          )}
        </div>
      )}
    </div>
  );

  const tabs = [
    {
      title: "Ongoing Assignments",
      value: "ongoing",
      content: renderAssignments(ongoingAssignments, "Ongoing Assignments"),
    },
    {
      title: "Deadline Crossed",
      value: "deadline-crossed",
      content: renderAssignments(
        deadlineCrossedAssignments,
        "Deadline Crossed Assignments"
      ),
    },
    {
      title: "Past Assignments",
      value: "completed",
      content: renderAssignments(completedAssignments, "Past Assignments"),
    },
  ];

  return (
    <div className="h-[20rem] md:h-[40rem] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start my-[1rem]">
      <Tabs
        key={`${ongoingAssignments.length}-${deadlineCrossedAssignments.length}-${completedAssignments.length}`}
        tabs={tabs}
      />
    </div>
  );
}
