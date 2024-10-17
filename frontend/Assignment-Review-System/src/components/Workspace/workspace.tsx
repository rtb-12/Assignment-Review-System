import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
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
import axios from "axios";

interface Workspace {
  workspace_name: string;
  workspace_description: string;
  workspace_logo_image: string;
  workspace_id: number;
}

const Workspace = () => {
  const [showCards, setShowCards] = useState(false);
  const [cardsVisible, setCardsVisible] = useState<number[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspaceLogo, setWorkspaceLogo] = useState<File | null>(null);
  const [workspaceCode, setWorkspaceCode] = useState("");

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/user/workspaces/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);
          setShowCards(true);
        } else {
          console.error("Failed to fetch workspaces");
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }
    };

    fetchWorkspaces();
  }, []);

  // Show workspaces in sequence
  useEffect(() => {
    if (showCards) {
      workspaces.forEach((_, index) => {
        setTimeout(() => {
          setCardsVisible((prev) => [...prev, index]);
        }, index * 300);
      });
    }
  }, [showCards, workspaces]);

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openJoinModal = () => setIsJoinModalOpen(true);
  const closeJoinModal = () => setIsJoinModalOpen(false);

  // Create Workspace
  const handleCreateWorkspace = async () => {
    const formData = new FormData();
    formData.append("workspace_name", workspaceName);
    formData.append("workspace_description", workspaceDescription);
    if (workspaceLogo) {
      formData.append("workspace_logo_image", workspaceLogo);
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/workspace/create/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const newWorkspace = await response.json();
        setWorkspaces((prev) => [...prev, newWorkspace]);
        closeCreateModal();
      } else {
        console.error("Failed to create workspace");
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  // Join Workspace
  const handleJoinWorkspace = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/workspace/join/",
        {
          token: workspaceCode,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Successfully joined the workspace:", response.data);
        closeJoinModal();
      } else {
        console.error("Failed to join the workspace:", response.data);
      }
    } catch (error) {
      console.error("Error joining the workspace:", error);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 bg-lightBg text-lightText dark:bg-darkBg dark:text-darkText">
      {/* Header */}
      <div className="flex flex-col w-[90%] md:flex-row justify-between items-center absolute top-8 md:top-16 left-4 md:left-10 text-center md:text-left space-y-4 md:space-y-0">
        <TypewriterEffect
          words={[
            { text: "Select" },
            { text: "A" },
            { text: "Workspace", className: "text-blue-500" },
          ]}
          className="text-2xl md:text-3xl font-bold"
          cursorClassName="bg-blue-500"
        />
        <div className="md:absolute md:right-0 md:mr-4">
          <Button
            className="h-[2.75rem] bg-blue-500 text-white px-4 py-2 rounded"
            onClick={openJoinModal}
          >
            Join A Workspace
          </Button>
        </div>
      </div>

      {/* Display workspace cards */}
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
                name={workspace.workspace_name}
                description={workspace.workspace_description}
                logo={workspace.workspace_logo_image}
                id={workspace.workspace_id}
              />
            </div>
          ))}
      </div>

      {/* Button to create a new workspace */}
      <button
        className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={openCreateModal}
      >
        <IconPlus size={24} />
      </button>
      <span className="absolute bottom-16 right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
        Create a Workspace
      </span>

      {/* Modal for creating workspace */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
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
          <CardFooter>
            <Button onClick={handleCreateWorkspace}>Create</Button>
          </CardFooter>
        </Card>
      </Modal>

      {/* Modal for joining workspace */}
      <Modal isOpen={isJoinModalOpen} onClose={closeJoinModal}>
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Join Workspace</CardTitle>
            <CardDescription>
              Enter the code to join a workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="workspaceCode">Workspace Code</Label>
                <Input
                  id="workspaceCode"
                  placeholder="Enter workspace code"
                  value={workspaceCode}
                  onChange={(e) => setWorkspaceCode(e.target.value)}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button onClick={handleJoinWorkspace}>Join</Button>
          </CardFooter>
        </Card>
      </Modal>
    </div>
  );
};

export default Workspace;
