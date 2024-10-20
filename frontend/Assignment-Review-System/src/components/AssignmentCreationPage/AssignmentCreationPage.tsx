import React, { useState, useEffect } from "react";
import { ComboboxDemo } from "./ComboBox";
import { DatePickerWithPresets } from "./Calendar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { FileUploadCreation } from "./FileUpload";
import Cookies from "js-cookie";
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
import { Tangent } from "lucide-react";

const Textarea = ({ value, onChange, className, ...props }) => (
  <textarea
    value={value}
    onChange={onChange}
    className={`w-full p-2 border border-gray-300 rounded mt-1 ${className}`}
    {...props}
  />
);

const AssignmentCreationPage = () => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [subtasks, setSubtasks] = useState([{ description: "", points: "" }]);
  const [deadline, setDeadline] = useState(null);

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

      const fetchMembersAndGroups = async () => {
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
        } catch (error) {
          console.error("Error fetching members and groups:", error);
        }
      };

      fetchMembersAndGroups();
    }
  }, [workspaceId, paramWorkspaceId, dispatch]);

  const handleSubtaskChange = (index: number, field: string, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index][field] = value;
    setSubtasks(newSubtasks);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, { description: "", points: "" }]);
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

  const handleSubmit = async () => {
    const payload = {
      assignment_name: assignmentName,
      assignment_description: assignmentDescription,
      deadline: deadline ? deadline.toISOString() : null,
      subtask_details: subtasks,
      attachments: files,
      individual_members: selectedMembers.map((member) => member.user_id), // Send member usernames
      // group_ids: selectedGroups,
    };
    console.log(payload);
    // console.log(selectedMembers);
    // Submit the form...
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
            onChange={(e) => setAssignmentDescription(e.target.value)}
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
          <div key={index} className="mb-4">
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

        {/* Assign Members */}
        <h2 className="text-lg font-bold mt-4">Assign Members</h2>
        <ComboboxDemo
          options={members}
          selectedOptions={selectedMembers}
          handleMemberSelect={handleMemberSelect}
          handleMemberRemove={handleMemberRemove}
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
