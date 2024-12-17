import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GlobalChatAssignment from "../GlobalChatAssignment/ChatBox";
import SubmissionModal from "./SubmissionModal";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { sub } from "date-fns";

const AssignmentSubmissionPage = () => {
  const { workspaceId, assignmentId } = useParams<{
    workspaceId: string;
    assignmentId: string;
  }>();
  const user = useSelector((state: RootState) => state.auth.user);
  interface Subtask {
    subtask_id: number;
    description: string;
    points: number;
    completed: boolean;
    pointsAssigned: number;
  }
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
    deadline: "",
    attachments: [],
    subtasks: [] as Subtask[],
  });
  const [assignmentStatus, setAssignmentStatus] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log("User not loaded yet");
      return;
    }
    const fetchAssignmentStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/assignment-status/${user.user_id}/${assignmentId}/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );

        if (response.status === 200) {
          const data = response.data;
          console.log("Assignment Status:", data);
          setAssignmentStatus(data.status === "Completed");
        } else {
          console.error("Failed to fetch assignment status");
        }
      } catch (error) {
        console.error("Error fetching assignment status:", error);
      }
    };
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
          console.log("Assignment Details:", data);
          setAssignment({
            assignment_id: data.assignment_id,
            assignment_name: data.assignment_name,
            assignment_description: data.assignment_description,
            assignor: data.assignor,
            deadline: data.deadline,
            attachments: data.attachments.map(
              (attachment: any) => `http://localhost:8000/media/${attachment}`
            ),
          });
        } else {
          console.error("Failed to fetch assignment details");
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
      }
    };
    const fetchSubtasks = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/${user.user_id}/subtasks/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );

        if (response.status === 200) {
          const data = response.data.map((subtask: any) => ({
            subtask_id: subtask.subtask_id,
            description: subtask.subtask_name,
            points: subtask.subtask_max_points,
            completed: subtask.status === "Completed",
            pointsAssigned: subtask.points_assigned,
          }));
          console.log("Subtasks:", data);
          setAssignment((prev) => {
            const newState = { ...prev, subtasks: data };
            return newState;
          });
        } else {
          console.error("Failed to fetch subtask data");
        }
      } catch (error) {
        console.error("Error fetching subtask data:", error);
      }
    };

    const fetchComments = async () => {
      if (!user) {
        console.log("User not loaded yet");
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/feedback/reviwee/${user.user_id}/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );

        if (response.status === 200) {
          setComments(response.data.feedback_details);
        } else {
          console.error("Failed to fetch comments");
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    fetchSubtasks();
    fetchAssignmentStatus();
    fetchAssignmentDetails();
    fetchComments();
  }, [workspaceId, assignmentId, user]);

  const handleAssignmentSubmission = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const createSafeFilename = (originalName: string): string => {
    // Remove path components and get only filename
    const filename = originalName.split(/[\\/]/).pop() || "";
    // Replace spaces and special chars with underscore
    return filename
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();
  };

  const handleModalSubmit = async (submissionData: {
    link: string;
    doc: string;
    files: File[];
  }) => {
    if (!user) {
      console.log("User not loaded yet");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("submission_link", submissionData.link);
      formData.append("submission_doc", submissionData.doc);
      // Sanitize and append files
      // Process files
      submissionData.files.forEach((file) => {
        // Create filename with proper path structure
        const timestamp = new Date().getTime();
        const safeFileName = `submissions/${
          user.user_id
        }/${timestamp}_${createSafeFilename(file.name)}`;
        console.log(safeFileName);
        // Create new file with safe name
        const safeFile = new File([file], safeFileName, {
          type: file.type,
        });
        formData.append("submission_attachments", safeFile);
      });

      const response = await axios.put(
        `http://localhost:8000/api/submissions/${assignment.assignor.user_id}/${assignment.assignment_id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        alert("Assignment Submitted Successfully!");
        setIsModalOpen(false);
      } else {
        console.error("Failed to submit assignment");
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim()) {
      const newCommentData = {
        isReviewer: false,
        feedback: newComment,
        time: new Date().toISOString(),
      };

      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/feedback/reviwee/${user.user_id}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );

        if (response.status === 200) {
          const updatedComments = [
            ...response.data.feedback_details,
            newCommentData,
          ];

          await axios.put(
            `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/${user.user_id}/update-feedback/`,
            { feedback_details: updatedComments },
            {
              headers: {
                Authorization: `Bearer ${Cookies.get("access")}`,
              },
            }
          );

          setComments(updatedComments);
          setNewComment("");
        } else {
          console.error("Failed to fetch original comments");
        }
      } catch (error) {
        console.error("Error posting comment:", error);
      }
    }
  };

  return (
    <div className="p-8 flex flex-col md:flex-row">
      <div className="md:w-3/4 pr-8">
        <h1 className="text-5xl font-bold mb-4">
          {assignment.assignment_name}
        </h1>
        <p className="mb-4">{assignment.assignment_description}</p>
        {assignment.attachments.length > 0 && (
          <div className="mb-4">
            {assignment.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-4 py-2 rounded mb-2 block dark:bg-zinc-50 dark:text-zinc-900 max-w-[12.75rem]"
              >
                Download Attachment {index + 1}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between m-4">
          <span
            className={`text-lg ${
              assignmentStatus ? "text-green-500" : "text-red-500"
            }`}
          >
            {assignmentStatus
              ? "Assignment Completed"
              : "Assignment Incomplete"}
          </span>
          {!assignmentStatus && (
            <Button
              onClick={handleAssignmentSubmission}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Submit Assignment
            </Button>
          )}
        </div>

        <h2 className="text-xl font-bold mb-2">Subtasks</h2>
        <div className="space-y-4">
          {assignment.subtasks?.map((subtask) => (
            <div
              key={subtask.subtask_id}
              className={`p-4 border border-gray-300 rounded-lg shadow-sm flex justify-between items-start ${
                subtask.completed ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div>
                <p className="font-bold">{subtask.description}</p>
                <p>Points: {subtask.points}</p>
              </div>
              <div className="flex flex-col items-end">
                <label className="mr-2">
                  Status:{" "}
                  <span
                    className={`${
                      subtask.completed ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {subtask.completed ? "Completed" : "Incomplete"}
                  </span>
                </label>
                <label>Points Assigned: {subtask.pointsAssigned}</label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Comments</h2>
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div
                key={index}
                className={`p-4 border border-gray-300 rounded-lg shadow-sm ${
                  comment.isReviewer ? "bg-gray-100" : ""
                }`}
              >
                <p className="font-bold">
                  {comment.isReviewer ? "Reviewer" : "Reviewee"}
                </p>
                <p>{comment.feedback}</p>
                <p className="text-sm text-gray-500">
                  {new Date(comment.time).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment"
              className="w-full mb-2"
            />
            <Button
              onClick={handleCommentSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Submit Comment
            </Button>
          </div>
        </div>
      </div>

      <div className="md:w-1/4">
        <GlobalChatAssignment />
      </div>

      <SubmissionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default AssignmentSubmissionPage;
