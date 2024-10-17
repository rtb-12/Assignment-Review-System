import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { useParams } from "react-router-dom";
import { setWorkspaceId } from "../../features/workspace/workspaceSlice";
import GroupCard from "./GroupCard";
import { Button } from "../ui/button";
import Modal from "../ui/Modal";
import Cookies from "js-cookie";
import { ComboboxDemo } from "../AssignmentCreationPage/ComboBox";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "../ui/table";

interface Group {
  id: number;
  name: string;
  logo: string;
  members: { username: string; avatar: string; userID: number }[];
}

interface Member {
  id: number;
  name: string;
  username: string;
}

export const GroupManagement = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupLogo, setGroupLogo] = useState<File | null>(null);
  const [groupDesc, setGroupDesc] = useState("");

  const dispatch = useDispatch();
  const { workspaceId: paramWorkspaceId } = useParams<{
    workspaceId: string;
  }>();

  let workspaceId = useSelector(
    (state: RootState) => state.workspace.workspaceId
  );

  useEffect(() => {
    if (!workspaceId && paramWorkspaceId) {
      dispatch(setWorkspaceId(paramWorkspaceId));
      workspaceId = paramWorkspaceId;
    }

    const fetchGroups = async () => {
      if (!workspaceId) {
        console.error("Workspace ID is not available");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/groups/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    const fetchMembers = async () => {
      if (!workspaceId) {
        console.error("Workspace ID is not available");
        return;
      }

      try {
        const membersResponse = await fetch(
          `http://localhost:8000/api/workspace/${workspaceId}/members/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );
        const membersData = await membersResponse.json();
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    if (workspaceId) {
      fetchGroups();
      fetchMembers();
    }
  }, [workspaceId, paramWorkspaceId, dispatch]);

  const handleCreateGroup = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("name", groupName);
    if (groupLogo) {
      formData.append("logo", groupLogo);
    }
    formData.append("description", groupDesc);
    formData.append(
      "members",
      JSON.stringify(selectedMembers.map((member) => member.id))
    );

    try {
      const response = await axios.post(
        `/api/workspace/${workspaceId}/create-group/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 201) {
        setGroups([...groups, response.data]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleDeleteMember = (memberId: number) => {
    setSelectedMembers(
      selectedMembers.filter((member) => member.id !== memberId)
    );
  };

  return (
    <div className="p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Group Management
        </h1>
        <Button onClick={handleCreateGroup}>Create Group</Button>
      </div>
      <div className="flex flex-wrap -mx-4">
        {Array.isArray(groups) &&
          groups.map((group) => (
            <div key={group.id} className="px-4 mb-8">
              <GroupCard {...group} allMembers={members} />
            </div>
          ))}
      </div>
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          width="800px"
          height="600px"
        >
          <div>
            <h2 className="text-2xl font-bold mb-4">Create Group</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="groupName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label
                  htmlFor="groupLogo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Group Logo
                </label>
                <input
                  type="file"
                  id="groupLogo"
                  onChange={(e) => setGroupLogo(e.target.files?.[0] || null)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label
                  htmlFor="groupDesc"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="groupDesc"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mt-4">Select Members</h3>
                <ComboboxDemo
                  options={members}
                  selectedOptions={selectedMembers}
                  setSelectedOptions={setSelectedMembers}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mt-4">Selected Members</h3>
                <div className="overflow-y-auto max-h-48 mt-2 border border-gray-300 rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Avatar</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMembers.map((member, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <img
                              src={member.avatar}
                              alt={member.username}
                              className="w-8 h-8 rounded-full"
                            />
                          </TableCell>
                          <TableCell>{member.username}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-red-500"
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmit}>Create Group</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GroupManagement;
