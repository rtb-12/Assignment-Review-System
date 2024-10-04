import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const GlobalChatAssignment = () => {
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

  return (
    <div className="md:w-1/4 mt-8 md:mt-0">
      <h2 className="text-xl font-bold mb-4">Global Assignment Chat</h2>
      <div className="bg-gray-100 dark:bg-gray-800 h-[30rem] p-4 rounded-lg overflow-y-auto mb-4 space-y-4">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-xl shadow-md max-w-[80%] ${
              msg.author === "You"
                ? "bg-blue-100 dark:bg-blue-700 self-end"
                : "bg-white dark:bg-gray-700 self-start"
            }`}
            style={{
              alignSelf: msg.author === "You" ? "flex-end" : "flex-start",
            }}
          >
            <strong className="text-gray-700 dark:text-gray-300">
              {msg.author}:
            </strong>
            <p className="text-gray-900 dark:text-gray-100">{msg.message}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleChatSubmit} className="flex justify-between">
        <Input
          value={newChatMessage}
          onChange={(e) => setNewChatMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow w-[16rem] p-2 border border-gray-300 dark:border-gray-600 rounded-l-xl"
        />
        <Button
          type="submit"
          className="bg-blue-500 dark:bg-blue-700 text-white px-4 rounded-r-xl"
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default GlobalChatAssignment;
