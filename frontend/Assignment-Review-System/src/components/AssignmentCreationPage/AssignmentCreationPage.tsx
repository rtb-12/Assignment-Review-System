import React, { useState, useEffect } from "react";
import { ComboboxDemo } from "./ComboBox";
import { DatePickerWithPresets } from "./Calendar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { FileUploadCreation } from "./FileUpload";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "../../components/ui/table";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useParams } from "react-router-dom";
import { setWorkspaceId } from "../../features/workspace/workspaceSlice";

interface TextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  [key: string]: string | number | boolean | undefined;
}

const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  className,
  ...props
}) => (
  <textarea
    value={value}
    onChange={onChange}
    className={`w-full p-2 border border-gray-300 rounded mt-1 ${className}`}
    {...props}
  />
);

const AssignmentCreationPage = () => {
  interface Member {
    user_id: string;
    profile_image: string;
    name: string;
  }
  interface Group {
    groupID: number;
    GroupName: string;
    members: {
      name: string;
      profile_image: string;
      user_id: number;
    }[];
  }

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [subtasks, setSubtasks] = useState([
    { subtask_id: generateUniqueId(), description: "", points: "" },
  ]);
  const [deadline, setDeadline] = useState<Date | null>(null);

  const dispatch = useDispatch();
  const { workspaceId: paramWorkspaceId } = useParams<{
    workspaceId: string;
  }>();

  let workspaceId = useSelector(
    (state: RootState) => state.workspace.workspaceId
  );

  useEffect(() => {
    if (paramWorkspaceId) {
      dispatch(setWorkspaceId(paramWorkspaceId));
      workspaceId = paramWorkspaceId;
    }

    const fetchMembersAndGroups = async () => {
      if (!workspaceId) return;

      try {
        const membersResponse = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/members/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );
        setMembers(membersResponse.data);
        const groupsResponse = await fetch(
          `http://localhost:8000/api/workspace/${workspaceId}/groups/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);

        // Log for debugging
        console.log("Fetched members:", membersResponse.data);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembersAndGroups();
  }, [workspaceId, paramWorkspaceId, dispatch]);

  const handleSubtaskChange = (index, field, value) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index][field] = value;
    setSubtasks(newSubtasks);
  };

  const addSubtask = () => {
    setSubtasks([
      ...subtasks,
      { subtask_id: generateUniqueId(), description: "", points: "" },
    ]);
  };

  const resetForm = () => {
    setAssignmentName("");
    setAssignmentDescription("");
    setSelectedMembers([]);
    setSelectedGroups([]);
    setFiles([]);
    setSubtasks([
      { subtask_id: generateUniqueId(), description: "", points: "" },
    ]);
    setDeadline(null);
  };
  const handleMemberSelect = (member) => {
    console.log("Selected member:", member);
    setSelectedMembers((prevMembers) => [...prevMembers, member]);
  };

  const handleMemberRemove = (member) => {
    setSelectedMembers((prevMembers) =>
      prevMembers.filter((prevMember) => prevMember.user_id !== member.user_id)
    );
  };
  const handleGroupSelect = (group: Group) => {
    console.log("Selected group:", group);
    setSelectedGroups((prevGroups) => [...prevGroups, group]);

    // Add all group members to selectedMembers if they're not already selected
    group.members.forEach((member) => {
      if (
        !selectedMembers.some((selected) => selected.user_id === member.user_id)
      ) {
        setSelectedMembers((prevMembers) => [...prevMembers, member]);
      }
    });
  };

  const handleGroupRemove = (group: Group) => {
    setSelectedGroups((prevGroups) =>
      prevGroups.filter((prevGroup) => prevGroup.groupID !== group.groupID)
    );
  };

  const handleSubmit = async () => {
    const subtaskDetails = subtasks.map((subtask) => ({
      subtask_id: subtask.subtask_id,
      description: subtask.description,
      points: subtask.points,
    }));

    const formData = new FormData();
    formData.append("assignment_name", assignmentName);
    formData.append("assignment_description", assignmentDescription);
    formData.append("deadline", deadline ? deadline.toISOString() : null);
    formData.append("subtask_details", JSON.stringify(subtaskDetails));

    // Add individual members
    selectedMembers.forEach((member) => {
      formData.append("individual_members", member.user_id);
    });

    // Add group IDs
    selectedGroups.forEach((group) => {
      formData.append("group_ids", group.groupID.toString());
    });

    files.forEach((file) => {
      formData.append("attachments", file);
    });

    console.log(formData);

    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/api/workspace/${workspaceId}/create-assignment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        alert("Assignment created successfully!");
        resetForm();
        console.log("Assignment created successfully!");
      } else {
        console.log("Error creating assignment!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-8 flex">
      <div className="w-3/4 pr-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-[2.5rem] font-bold">Create an Assignment</h1>
          <Button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create Assignment
          </Button>
        </div>

        {/* Assignment Name and Description */}
        <div className="mb-4">
          <label className="block text-gray-700">Name of Assignment</label>
          <Input
            type="text"
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Description</label>
          <Textarea
            value={assignmentDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setAssignmentDescription(e.target.value)
            }
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <FileUploadCreation setFiles={setFiles} />
        </div>

        {/* Subtasks */}
        <h2 className="text-xl font-bold mb-2">Create Subtask</h2>
        {subtasks.map((subtask, index) => (
          <div key={subtask.subtask_id} className="mb-4">
            <label className="block text-gray-700">Subtask Description</label>
            <Input
              type="text"
              value={subtask.description}
              onChange={(e) =>
                handleSubtaskChange(index, "description", e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
            <label className="block text-gray-700 mt-2">Points</label>
            <Input
              type="number"
              value={subtask.points}
              onChange={(e) =>
                handleSubtaskChange(index, "points", e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>
        ))}
        <Button
          onClick={addSubtask}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          + Add Subtask
        </Button>
      </div>

      {/* Sidebar: Members and Deadline */}
      <div className="w-1/4">
        <h2 className="text-lg font-bold">Overall Deadline</h2>
        <DatePickerWithPresets setDate={setDeadline} />
        {/* Group Selection */}
        <h2 className="text-lg font-bold mt-4">Assign Groups</h2>
        <ComboboxDemo
          options={groups}
          selectedOptions={selectedGroups}
          handleMemberSelect={handleGroupSelect}
          handleMemberRemove={handleGroupRemove}
          labelKey="GroupName"
          valueKey="groupID"
        />

        {/* Selected Groups Table */}
        <h2 className="text-lg font-bold mt-4">Assigned Groups</h2>
        <div className="overflow-y-scroll h-[17rem] mt-2 border border-gray-300 rounded mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedGroups.map((group, index) => (
                <TableRow key={group.groupID}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{group.GroupName}</TableCell>
                  <TableCell>{group.members.length}</TableCell>
                  <TableCell>
                    <Button
                      className="bg-red-500 text-white"
                      onClick={() => handleGroupRemove(group)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Assign Members */}
        <h2 className="text-lg font-bold mt-4">Assign Members</h2>
        <ComboboxDemo
          options={members}
          selectedOptions={selectedMembers}
          handleMemberSelect={handleMemberSelect}
          handleMemberRemove={handleMemberRemove}
          labelKey="name"
          valueKey="user_id"
        />

        {/* Selected Members Table */}
        <h2 className="text-lg font-bold mt-4">Assigned Members</h2>
        <div className="overflow-y-scroll h-[17rem] mt-2 border border-gray-300 rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Avatar</TableHead>
                <TableHead>Name</TableHead>
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
                      className="bg-red-500 text-white"
                      onClick={() => handleMemberRemove(member)}
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
    </div>
  );
};

export default AssignmentCreationPage;
