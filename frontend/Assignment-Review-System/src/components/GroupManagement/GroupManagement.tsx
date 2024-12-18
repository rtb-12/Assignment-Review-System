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
import { ComboboxDemo } from "./ComboBox";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "../ui/table";

interface Group {
  groupID: number;
  GroupName: string;
  workspace_id: number;
  description?: string;
  groupProfileImage?: string;
  members?: { name: string; profile_image: string; user_id: number }[];
}

interface Member {
  user_id: string;
  profile_image: string;
  name: string;
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
        console.log("Raw response:", response.data);
        setGroups(response.data);
        console.log("Groups after setting:", response.data);
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
        const membersResponse = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/members/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );
        console.log("Raw response:", membersResponse);
        const membersData: Member[] = membersResponse.data;
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
    formData.append("GroupName", groupName);
    if (groupLogo) {
      formData.append("groupProfileImage", groupLogo);
    }
    formData.append("description", groupDesc);
    formData.append(
      "members",
      JSON.stringify(selectedMembers.map((member) => member.user_id))
    );

    // Log each key-value pair
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: `, value);
    }

    // Log complete payload
    console.log("Selected Members:", selectedMembers);
    console.log("Group Logo:", groupLogo);
    console.log("Form Data Contents:", {
      GroupName: groupName,
      groupProfileImage: groupLogo ? groupLogo.name : "No file selected",
      description: groupDesc,
      members: selectedMembers.map((member) => member.user_id),
    });
    try {
      const response = await axios.post(
        `http://localhost:8000/api/workspace/${workspaceId}/create-group/`,
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
        setGroupName("");
        setGroupLogo(null);
        setGroupDesc("");
        setSelectedMembers([]);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleMemberSelect = (member: Member) => {
    console.log("Selected member:", member);
    setSelectedMembers((prevMembers) => [...prevMembers, member]);
  };

  const handleMemberRemove = (member: Member) => {
    setSelectedMembers((prevMembers) =>
      prevMembers.filter((prevMember) => prevMember.user_id !== member.user_id)
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
        {groups.map((group) => (
          <div key={group.groupID} className="px-4 mb-8">
            <GroupCard
              groupID={group.groupID}
              GroupName={group.GroupName}
              groupProfileImage={group.groupProfileImage}
              description={group.description}
              members={group.members || []} // Group members
              allMembers={members} // All workspace members
              workspace_id={group.workspace_id}
            />
          </div>
        ))}
      </div>
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="max-w-lg p-6 bg-white rounded-lg shadow-lg overflow-auto"
        >
          <h2 className="text-2xl font-bold mb-4">Create Group</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="groupLogo" className="block text-sm font-medium">
                Group Logo
              </label>
              <input
                type="file"
                id="groupLogo"
                onChange={(e) => setGroupLogo(e.target.files?.[0] || null)}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="groupDesc" className="block text-sm font-medium">
                Description
              </label>
              <textarea
                id="groupDesc"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold">Select Members</h3>
              <ComboboxDemo
                options={members}
                selectedOptions={selectedMembers}
                handleMemberSelect={handleMemberSelect}
                handleMemberRemove={handleMemberRemove}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold mt-4">Selected Members</h3>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMembers.map((member, index) => (
                    <TableRow key={member.user_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <img
                          src={
                            member.profile_image
                              ? decodeURIComponent(
                                  member.profile_image.replace(
                                    "http://localhost:8000/media/",
                                    ""
                                  )
                                )
                              : "https://via.placeholder.com/150"
                          }
                          alt={member.name}
                          className="w-8 h-8 rounded-full"
                        />
                      </TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleMemberRemove(member)}
                          className="text-red-500"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmit}>Create Group</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GroupManagement;
