import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GlobalChatAssignment from "../GlobalChatAssignment/ChatBox";
import SubmissionModal from "./SubmissionModal";

const AssignmentSubmissionPage = () => {
  const { workspaceId, assignmentId } = useParams<{
    workspaceId: string;
    assignmentId: string;
  }>();

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

  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

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

    const fetchComments = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/feedback/reviwee/${userId}/`,
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
    fetchComments();
  }, [workspaceId, assignmentId]);

  const handleAssignmentSubmission = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = async (submissionData: {
    link: string;
    doc: string;
    files: File[];
  }) => {
    try {
      const formData = new FormData();
      formData.append("submission_link", submissionData.link);
      formData.append("submission_doc", submissionData.doc);
      submissionData.files.forEach((file) => {
        formData.append("submission_attachments", file);
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
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/feedback/reviwee/${userId}`,
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
            `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/${user_id}/update-feedback/`,
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
              assignment.isCompleted ? "text-green-500" : "text-red-500"
            }`}
          >
            {assignment.isCompleted
              ? "Assignment Completed"
              : "Assignment Incomplete"}
          </span>
          {!assignment.isCompleted && (
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
          {assignment.subtask_details.map((subtask) => (
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
              <div>
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
