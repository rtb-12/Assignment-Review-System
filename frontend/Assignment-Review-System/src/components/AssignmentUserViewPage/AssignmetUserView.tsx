import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const AssignmentSubmissionPage = () => {
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
  const [chatMessages, setChatMessages] = useState([
    { author: "Reviewer", message: "Don't forget to check data quality!" },
    { author: "You", message: "I'll make sure to address that, thanks!" },
  ]);
  const [newChatMessage, setNewChatMessage] = useState("");

  // Handle chat messages
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (newChatMessage.trim()) {
      setChatMessages([
        ...chatMessages,
        { author: "You", message: newChatMessage },
      ]);
      setNewChatMessage("");
    }
  };

  // Handle assignment submission
  const handleAssignmentSubmission = () => {
    setAssignment({ ...assignment, isCompleted: true });
    alert("Assignment Submitted!");
  };

  // Handle posting comments
  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      setComments([...comments, { author: "You", message: newComment }]);
      setNewComment("");
    }
  };

  return (
    <div className="p-8 flex flex-col md:flex-row">
      {/* 3/4 width for assignment submission */}
      <div className="md:w-3/4 pr-8">
        <h1 className="text-5xl font-bold mb-4">{assignment.name}</h1>
        <p className="mb-4">{assignment.description}</p>
        <a
          href={assignment.fileUrl}
          download
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
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
              Submit Assignment
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

        {/* Feedback and Comments Section */}
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

        {/* Comments section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Comments</h2>
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-100">
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

      {/* 1/4 width for global chat */}
      <div className="md:w-1/4 mt-8 md:mt-0">
        <h2 className="text-xl font-bold mb-4">Global Assignment Chat</h2>
        <div className="bg-gray-100 h-[30rem] p-4 rounded-lg overflow-y-auto mb-4 space-y-4">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl shadow-md max-w-[80%] ${
                msg.author === "You"
                  ? "bg-blue-100 self-end"
                  : "bg-white self-start"
              }`}
              style={{
                alignSelf: msg.author === "You" ? "flex-end" : "flex-start",
              }}
            >
              <strong className="text-gray-700">{msg.author}:</strong>
              <p className="text-gray-900">{msg.message}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="flex justify-between">
          <Input
            value={newChatMessage}
            onChange={(e) => setNewChatMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow w-[16rem] p-2 border border-gray-300 rounded-l-xl"
          />
          <Button
            type="submit"
            className="bg-blue-500 text-white px-4 rounded-r-xl"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AssignmentSubmissionPage;
