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
      <div className="flex-1 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            {isEditing ? (
              <Input
                value={editedAssignment.assignment_name}
                onChange={(e) =>
                  handleInputChange("assignment_name", e.target.value)
                }
                className="w-full mb-2"
              />
            ) : (
              assignment.assignment_name
            )}
          </h1>
          <Button
            onClick={handleEditToggle}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isEditing ? "Update" : "Edit"}
          </Button>
        </div>

        {/* Description */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Description
          </h2>
          {isEditing ? (
            <Textarea
              value={editedAssignment.assignment_description}
              onChange={(e) =>
                handleInputChange("assignment_description", e.target.value)
              }
              className="w-full mb-2"
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              {assignment.assignment_description}
            </p>
          )}
        </div>

        {/* Deadline */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Deadline
          </h2>
          {isEditing ? (
            <Input
              type="datetime-local"
              value={editedAssignment.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              className="w-full mb-2"
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              {assignment.deadline}
            </p>
          )}
        </div>

        {/* Subtasks */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Subtasks
          </h2>
          {isEditing ? (
            <div>
              {editedAssignment.subtask_details.map((subtask, index) => (
                <div
                  key={subtask.subtask_id}
                  className="flex items-center mb-2"
                >
                  <Input
                    value={subtask.description}
                    onChange={(e) =>
                      handleSubtaskChange(index, "description", e.target.value)
                    }
                    placeholder="Subtask Description"
                    className="mr-2 flex-grow"
                  />
                  <Input
                    value={subtask.points}
                    onChange={(e) =>
                      handleSubtaskChange(index, "points", e.target.value)
                    }
                    placeholder="Points"
                    type="number"
                    className="mr-2 w-24"
                  />
                  <Button
                    onClick={() => handleSubtaskDelete(index)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </Button>
                </div>
              ))}
              <Button
                onClick={addSubtask}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Add Subtask
              </Button>
            </div>
          ) : (
            <ul className="list-disc ml-5">
              {assignment.subtask_details.map((subtask) => (
                <li key={subtask.subtask_id}>
                  {subtask.description} - {subtask.points} points
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Attachments */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Attachments
          </h2>
          {isEditing ? (
            <div>
              {editedAssignment.attachments.map((file, index) => (
                <div key={index} className="flex items-center">
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline mr-2"
                  >
                    {file.split("/").pop()}
                  </a>
                  <Button
                    onClick={() => handleFileDelete(file)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <FileUploadCreation setFiles={setNewFiles} newFiles={newFiles} />
            </div>
          ) : (
            <ul className="list-disc ml-5">
              {assignment.attachments.map((file, index) => (
                <li key={index}>
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    {file.split("/").pop()}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tabs */}
        <TabsAssignmentReview />
      </div>

      {/* Chat */}
      <GlobalChatAssignment />
    </div>
  );
};

export default AssignmentReviewerCard;
