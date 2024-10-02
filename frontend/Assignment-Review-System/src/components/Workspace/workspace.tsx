import React, { useState, useEffect } from "react";
import { TypewriterEffect } from "../ui/typewriter-effect";
import WorkspaceCard from "./workspaceCard";
import { IconPlus } from "@tabler/icons-react";
import Modal from "../ui/Modal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

const Workspace = () => {
  const [showCards, setShowCards] = useState(false);
  const [cardsVisible, setCardsVisible] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspaceLogo, setWorkspaceLogo] = useState<File | null>(null);

  // Example data for available workspaces
  const workspaces = [
    {
      name: "Development Team",
      description: "Workspace for the development team.",
      members: 10,
    },
    {
      name: "Marketing Team",
      description: "Workspace for the marketing team.",
      members: 8,
    },
    {
      name: "Design Team",
      description: "Workspace for the design team.",
      members: 5,
    },
  ];

  // Wait for the typewriter effect to complete, then show the cards
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCards(true);
    }, 2000); // Adjust the timeout based on typewriter speed
    return () => clearTimeout(timer);
  }, []);

  // Animating cards row by row (populating from the center)
  useEffect(() => {
    if (showCards) {
      workspaces.forEach((_, index) => {
        setTimeout(() => {
          setCardsVisible((prev) => [...prev, index]);
        }, index * 300); // Delay between each card
      });
    }
  }, [showCards]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleCreateWorkspace = () => {
    // Handle the creation of the workspace
    console.log("Workspace Created:", {
      name: workspaceName,
      description: workspaceDescription,
      logo: workspaceLogo,
    });
    closeModal();
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 bg-lightBg text-lightText dark:bg-darkBg dark:text-darkText">
      <div className="absolute top-8 md:top-16 left-4 md:left-10 text-center md:text-left">
        <TypewriterEffect
          words={[
            { text: "Select" },
            { text: "A" },
            { text: "Workspace", className: "text-blue-500" },
          ]}
          className="text-2xl md:text-3xl font-bold "
          cursorClassName="bg-blue-500"
        />
      </div>

      {/* Adjusting gap between text and cards for mobile responsiveness */}
      <div className="flex flex-wrap justify-center gap-4 mt-20 md:mt-12 w-full px-4">
        {showCards &&
          workspaces.map((workspace, index) => (
            <div
              key={index}
              className={`transition-opacity duration-500 ease-out transform ${
                cardsVisible.includes(index)
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-50"
              }`}
              style={{
                transitionDelay: `${index * 300}ms`,
              }}
            >
              <WorkspaceCard
                name={workspace.name}
                description={workspace.description}
                members={workspace.members}
              />
            </div>
          ))}
      </div>

      {/* Floating Action Button for creating a workspace */}
      <button
        className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={openModal}
      >
        <IconPlus size={24} />
      </button>
      <span className="absolute bottom-16 right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
        Create a Workspace
      </span>

      {/* Modal for creating a workspace */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Create Workspace</CardTitle>
            <CardDescription>
              Fill in the details to create a new workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input
                    id="workspaceName"
                    placeholder="Enter workspace name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="workspaceDescription">Description</Label>
                  <textarea
                    id="workspaceDescription"
                    placeholder="Enter workspace description"
                    className="h-24 p-2 border border-gray-300 rounded-md"
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="workspaceLogo">Logo</Label>
                  <Input
                    id="workspaceLogo"
                    type="file"
                    onChange={(e) =>
                      setWorkspaceLogo(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace}>Create</Button>
          </CardFooter>
        </Card>
      </Modal>
    </div>
  );
};

export default Workspace;
