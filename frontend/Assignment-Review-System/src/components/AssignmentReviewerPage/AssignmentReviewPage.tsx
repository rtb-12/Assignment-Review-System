import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SubmissionViewModal from "./SubmissionViewModal";
import GlobalChatAssignment from "../GlobalChatAssignment/ChatBox";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";

const AssignmentReviewPage = () => {
  const { workspaceId, assignmentId, revieweeId } = useParams<{
    workspaceId: string;
    assignmentId: string;
    revieweeId: string;
  }>();

  const [assignment, setAssignment] = useState({
    isCompleted: false,
    fileUrl: "/path-to-file",
    subtasks: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    link: "",
    doc: "",
    files: [],
  });
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchSubtasks = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/${revieweeId}/subtasks/`,
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
          setAssignment((prev) => ({ ...prev, subtasks: data }));
        } else {
          console.error("Failed to fetch subtask data");
        }
      } catch (error) {
        console.error("Error fetching subtask data:", error);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/feedback/reviwee/${revieweeId}/`,
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
  }, [workspaceId, assignmentId, revieweeId]);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAssignmentSubmissionView = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/${revieweeId}/submission/`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;
        setSubmissionData({
          link: data.submission_link,
          doc: data.submission_doc,
          files: data.submission_attachments,
        });
        setIsModalOpen(true);
      } else {
        console.error("Failed to fetch submission data");
      }
    } catch (error) {
      console.error("Error fetching submission data:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim()) {
      const newCommentData = {
        isReviewer: true,
        feedback: newComment,
        time: new Date().toISOString(),
      };

      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/feedback/reviwee/${revieweeId}/`,
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
            `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/${revieweeId}/update-feedback/`,
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

  const handleSubtaskToggle = (index: number) => {
    const updatedSubtasks = assignment.subtasks.map((subtask, i) =>
      i === index ? { ...subtask, completed: !subtask.completed } : subtask
    );
    setAssignment({ ...assignment, subtasks: updatedSubtasks });
  };

  const handlePointsChange = (index: number, points: number) => {
    const updatedSubtasks = assignment.subtasks.map((subtask, i) =>
      i === index ? { ...subtask, pointsAssigned: points } : subtask
    );
    setAssignment({ ...assignment, subtasks: updatedSubtasks });
  };

  const handleUpdateSubtask = async (index: number) => {
    const subtask = assignment.subtasks[index];
    try {
      const response = await axios.put(
        `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/${revieweeId}/subtasks/${subtask.subtask_id}/update-status/`,
        {
          status: subtask.completed ? "Completed" : "Incomplete",
          points_assign: subtask.pointsAssigned,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
          },
        }
      );

      if (response.status === 200) {
        alert("Subtask updated successfully!");
      } else {
        console.error("Failed to update subtask");
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  return (
    <div className="p-8 flex flex-col md:flex-row">
      <div className="md:w-3/4 pr-8">
        <div className="flex items-center justify-between m-4">
          <span
            className={`text-xl font-bold ${
              assignment.isCompleted ? "text-green-500" : "text-red-500"
            }`}
          >
            {assignment.isCompleted
              ? "Assignment Completed"
              : "Assignment Incomplete"}
          </span>
          {!assignment.isCompleted && (
            <Button
              onClick={handleAssignmentSubmissionView}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              View Submission
            </Button>
          )}
        </div>

        <h2 className="text-xl font-bold mb-2">Subtasks</h2>
        <div className="space-y-4">
          {assignment.subtasks.map((subtask, index) => (
            <div
              key={index}
              className={`p-4 border border-gray-300 rounded-lg shadow-sm flex justify-between items-start ${
                subtask.completed ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div>
                <p className="font-bold">{subtask.description}</p>
                <p>Max Points: {subtask.points}</p>
                <p>Points Assigned: {subtask.pointsAssigned}</p>
              </div>
              <div>
                <label className="mr-2">
                  Status:{" "}
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleSubtaskToggle(index)}
                    className="mr-2"
                  />
                  <span
                    className={`${
                      subtask.completed ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {subtask.completed ? "Completed" : "Incomplete"}
                  </span>
                </label>
                <Input
                  type="number"
                  value={subtask.pointsAssigned}
                  onChange={(e) =>
                    handlePointsChange(index, parseInt(e.target.value, 10))
                  }
                  className="w-20 ml-2"
                />
                <Button
                  onClick={() => handleUpdateSubtask(index)}
                  className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                >
                  Update
                </Button>
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
      <GlobalChatAssignment />
      <SubmissionViewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        submissionData={submissionData}
      />
    </div>
  );
};

export default AssignmentReviewPage;
