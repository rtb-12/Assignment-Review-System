"use client";

import { useEffect, useState } from "react";
import { Tabs } from "../ui/tabs";
import { AssignmentCard } from "./AssignmentCard";
import axios from "axios";
import Cookies from "js-cookie";

const fetchOngoingAssignments = async () => {
  try {
    const response = await axios.get(
      "http://localhost:8000/api/ongoing-assignments",
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

const fetchDeadlineCrossedAssignments = async () => {
  try {
    const response = await axios.get(
      "http://localhost:8000/api/crossed-deadline-assignments/",
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

const fetchCompletedAssignmnets = async () => {
  try {
    const response = await axios.get(
      "http://localhost:8000/api/completed-assignments/",
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
  const [ongoingAssignments, setOngoingAssignments] = useState([]);
  const [deadlineCrossedAssignments, setDeadlineCrossedAssignments] = useState(
    []
  );
  const [completedAssignments, setCompletedAssignments] = useState([]);

  useEffect(() => {
    const getCompletedAssignments = async () => {
      const data = await fetchCompletedAssignmnets();
      setCompletedAssignments(data);
    };

    getCompletedAssignments();
  }, []);

  useEffect(() => {
    const getDeadlineCrossedAssignments = async () => {
      const data = await fetchDeadlineCrossedAssignments();
      setDeadlineCrossedAssignments(data);
    };

    getDeadlineCrossedAssignments();
  }, []);

  useEffect(() => {
    const getOngoingAssignments = async () => {
      const data = await fetchOngoingAssignments();
      setOngoingAssignments(data);
    };

    getOngoingAssignments();
  }, []);

  const tabs = [
    {
      title: "Ongoing Assignments",
      value: "Ongoing Assignments",
      content: (
        <div className="w-full h-full relative overflow-x-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
          <p className="pb-4">Ongoing Assignments</p>
          <div className="flex flex-row gap-4 overflow-x-auto flex-nowrap">
            {/* Render AssignmentCard components dynamically */}
            {Array.isArray(ongoingAssignments) &&
              ongoingAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
          </div>
        </div>
      ),
    },
    {
      title: "Deadline Crossed",
      value: "Deadline Crossed",
      content: (
        <div className="w-full h-full relative overflow-x-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
          <p className="pb-4">Deadline Crossed Assignments</p>
          <div className="flex flex-row gap-4 overflow-x-auto flex-nowrap">
            {deadlineCrossedAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Notifications",
      value: "Notifications",
      content: (
        <div className="w-full h-full relative overflow-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
          <p className="pb-4">Notifications</p>
        </div>
      ),
    },
    {
      title: "Past Assignments",
      value: "Past Assignments",
      content: (
        <div className="w-full h-full relative overflow-x-auto rounded-2xl p-6 text-xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 bg-opacity-70">
          <p className="pb-4">Past Assignments</p>
          <div className="flex flex-row gap-4 overflow-x-auto flex-nowrap">
            {completedAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
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
