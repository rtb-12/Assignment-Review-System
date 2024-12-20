"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TabsAssignmentReview } from "./Tabs";
import GlobalChatAssignment from "../GlobalChatAssignment/ChatBox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import axios from "axios";
import Cookies from "js-cookie";
import { FileUploadCreation } from "./FileUpload";

const AssignmentReviewerCard = () => {
  const { workspaceId, assignmentId } = useParams<{
    workspaceId: string;
    assignmentId: string;
  }>();

  const [isEditing, setIsEditing] = useState(false);
  const [assignment, setAssignment] = useState({
    assignment_id: 0,
    assignment_name: "",
    assignment_description: "",
    assignor: {
      user_id: 0,
      name: "",
      email: "",
      profile_image: "",
    },
    subtask_details: [],
    deadline: "",
    attachments: [],
  });
  const [editedAssignment, setEditedAssignment] = useState(assignment);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const handleEditToggle = () => {
    if (isEditing) {
      handleUpdateAssignment();
    } else {
      setEditedAssignment({ ...assignment });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedAssignment((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubtaskChange = (index: number, field: string, value: string) => {
    const updatedSubtasks = [...editedAssignment.subtask_details];
    updatedSubtasks[index][field] = value;
    setEditedAssignment((prev) => ({
      ...prev,
      subtask_details: updatedSubtasks,
    }));
  };

  const addSubtask = () => {
    const newSubtask = {
      subtask_id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: "",
      points: "",
    };
    setEditedAssignment((prev) => ({
      ...prev,
      subtask_details: [...prev.subtask_details, newSubtask],
    }));
  };

  const handleSubtaskDelete = (index: number) => {
    const updatedSubtasks = [...editedAssignment.subtask_details];
    updatedSubtasks.splice(index, 1);
    setEditedAssignment((prev) => ({
      ...prev,
      subtask_details: updatedSubtasks,
    }));
  };

  const handleFileDelete = (fileToDelete: string) => {
    setEditedAssignment((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((file) => file !== fileToDelete),
    }));
  };

  const handleUpdateAssignment = async () => {
    try {
      const formData = new FormData();

      formData.append("assignment_name", editedAssignment.assignment_name);
      formData.append(
        "assignment_description",
        editedAssignment.assignment_description
      );
      formData.append("deadline", editedAssignment.deadline);

      // Append subtasks
      formData.append(
        "subtask_details",
        JSON.stringify(editedAssignment.subtask_details)
      );

      // Append existing attachments
      editedAssignment.attachments.forEach((file) =>
        formData.append(
          "attachments",
          file.replace("http://localhost:8000/media/", "")
        )
      );

      // Append new files
      newFiles.forEach((file) => formData.append("attachments", file));

      const response = await axios.put(
        `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/update/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        setAssignment(response.data);
        alert("Assignment updated successfully!");
      } else {
        console.error("Failed to update assignment");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/description/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );

        if (response.status === 200) {
          const data = response.data;
          setAssignment({
            assignment_id: data.assignment_id,
            assignment_name: data.assignment_name,
            assignment_description: data.assignment_description,
            assignor: data.assignor,
            subtask_details: data.subtask_details,
            deadline: data.deadline,
            attachments: data.attachments.map(
              (attachment) => `http://localhost:8000/media/${attachment}`
            ),
          });
        } else {
          console.error("Failed to fetch assignment details");
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
      }
    };

    fetchAssignmentDetails();
  }, [workspaceId, assignmentId]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {isEditing ? (
                <Input
                  value={editedAssignment.assignment_name}
                  onChange={(e) =>
                    handleInputChange("assignment_name", e.target.value)
                  }
                  className="w-full"
                />
              ) : (
                assignment.assignment_name
              )}
            </h1>
            <div className="flex items-center mt-2 text-gray-600 dark:text-gray-400">
              <div className="flex items-center mr-4">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Assigned by: {assignment.assignor.name}</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  Due: {new Date(assignment.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleEditToggle}
            className={`${
              isEditing
                ? "bg-green-500 hover:bg-green-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white px-6 py-2 rounded-lg transition-colors duration-200`}
          >
            {isEditing ? "Save Changes" : "Edit Assignment"}
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Description Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              Description
            </h2>
            {isEditing ? (
              <Textarea
                value={editedAssignment.assignment_description}
                onChange={(e) =>
                  handleInputChange("assignment_description", e.target.value)
                }
                className="min-h-[200px] w-full"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                {assignment.assignment_description}
              </div>
            )}
          </div>

          {/* Attachments Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              Attachments
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                {editedAssignment.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 truncate flex-1"
                    >
                      {file.split("/").pop()}
                    </a>
                    <Button
                      onClick={() => handleFileDelete(file)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md ml-2"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <FileUploadCreation
                  setFiles={setNewFiles}
                  newFiles={newFiles}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                {assignment.attachments.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span className="text-blue-500 hover:text-blue-600">
                      {file.split("/").pop()}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Subtasks
          </h2>
          {isEditing ? (
            <div className="space-y-4">
              {editedAssignment.subtask_details.map((subtask, index) => (
                <div
                  key={subtask.subtask_id}
                  className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex-grow space-y-2">
                    <Input
                      value={subtask.description}
                      onChange={(e) =>
                        handleSubtaskChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Subtask Description"
                      className="w-full"
                    />
                    <Input
                      value={subtask.points}
                      onChange={(e) =>
                        handleSubtaskChange(index, "points", e.target.value)
                      }
                      placeholder="Points"
                      type="number"
                      className="w-32"
                    />
                  </div>
                  <Button
                    onClick={() => handleSubtaskDelete(index)}
                    variant="destructive"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </Button>
                </div>
              ))}
              <Button
                onClick={addSubtask}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                + Add Subtask
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {assignment.subtask_details.map((subtask) => (
                <div
                  key={subtask.subtask_id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {subtask.description}
                  </p>
                  <p className="text-m text-gray-600 dark:text-gray-400">
                    Points: {subtask.points}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs Section */}
        <div className="mt-6">
          <TabsAssignmentReview />
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-1/4 border-l border-gray-200 dark:border-gray-700">
        <GlobalChatAssignment />
      </div>
    </div>
  );
};

export default AssignmentReviewerCard;
