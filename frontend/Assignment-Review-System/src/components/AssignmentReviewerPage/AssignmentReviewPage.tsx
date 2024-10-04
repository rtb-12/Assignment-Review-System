import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GlobalChatAssignment from "../GlobalChatAssignment/ChatBox";

const AssignmentReviewPage = () => {
  const [assignment, setAssignment] = useState({
    name: "Machine Learning Project",
    description:
      "This assignment involves building a machine learning model to classify data points accurately.",
    isCompleted: false,
    fileUrl: "/path-to-file",
    subtasks: [
      { description: "Data Preprocessing", points: 10, completed: false },
      { description: "Model Training", points: 20, completed: false },
      { description: "Model Evaluation", points: 15, completed: true },
    ],
  });

  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { author: "Reviewer", message: "Good start! Keep going!" },
  ]);

  const handleAssignmentSubmission = () => {
    setAssignment({ ...assignment, isCompleted: true });
    alert("Assignment Submitted!");
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      setComments([...comments, { author: "You", message: newComment }]);
      setNewComment("");
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
      i === index ? { ...subtask, points } : subtask
    );
    setAssignment({ ...assignment, subtasks: updatedSubtasks });
  };

  const handleSubtaskUpdate = (index: number) => {
    // Logic to update the subtask can be added here
    alert(`Subtask ${index + 1} updated!`);
  };

  return (
    <div className="p-8 flex flex-col md:flex-row">
      <div className="md:w-3/4 pr-8">
        <h1 className="text-5xl font-bold mb-4">{assignment.name}</h1>
        <p className="mb-4">{assignment.description}</p>
        <a
          href={assignment.fileUrl}
          download
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Download Assignment Files
        </a>

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
                <p className="font-bold dark:text-zinc-600">
                  {subtask.description}
                </p>
                <p className="dark:text-zinc-600">Points: {subtask.points}</p>
              </div>
              <div className="flex items-center ">
                <label className="mr-2 dark:text-zinc-600">
                  Status:{" "}
                  <span
                    className={`${
                      subtask.completed ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {subtask.completed ? "Completed" : "Incomplete"}
                  </span>
                </label>
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => handleSubtaskToggle(index)}
                  className="mr-4"
                />
                <input
                  type="number"
                  value={subtask.points}
                  onChange={(e) =>
                    handlePointsChange(index, parseInt(e.target.value, 10))
                  }
                  className="w-20 p-2 border border-gray-300 rounded-lg mr-4 dark:text-zinc-600"
                />
                <Button
                  onClick={() => handleSubtaskUpdate(index)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Update
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Feedback & Comments</h2>
          <div className="flex">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              className="w-full p-4 border border-gray-300 rounded-lg"
            />
            <Button
              className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleCommentSubmit}
            >
              Post Comment
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Comments</h2>
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gray-100 dark:text-zinc-600"
                >
                  <strong>{comment.author}:</strong>
                  <p>{comment.message}</p>
                </div>
              ))
            ) : (
              <p>No comments yet.</p>
            )}
          </div>
        </div>
      </div>
      <GlobalChatAssignment />
    </div>
  );
};

export default AssignmentReviewPage;
