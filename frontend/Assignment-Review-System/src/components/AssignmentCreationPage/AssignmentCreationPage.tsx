import React, { useState } from "react";
import { ComboboxDemo } from "./ComboBox";
import { DatePickerWithPresets } from "./Calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploadCreation } from "./FileUpload";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";

const Textarea = ({ value, onChange, className, ...props }) => (
  <textarea
    value={value}
    onChange={onChange}
    className={`w-full p-2 border border-gray-300 rounded mt-1 ${className}`}
    {...props}
  />
);

const AssignmentCreationPage = () => {
  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [subtasks, setSubtasks] = useState([{ description: "", points: "" }]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubtaskChange = (index: number, field: string, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index][field] = value;
    setSubtasks(newSubtasks);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, { description: "", points: "" }]);
  };

  const handleSubmit = () => {
    console.log({
      assignmentName,
      assignmentDescription,
      file,
      subtasks,
    });
  };

  // Sample data for table
  const candidates = [
    { sno: 1, avatar: "👤", name: "John Doe" },
    { sno: 2, avatar: "👤", name: "Jane Smith" },
    { sno: 3, avatar: "👤", name: "David Miller" },
    { sno: 4, avatar: "👤", name: "Emily Johnson" },
    { sno: 5, avatar: "👤", name: "Mark Lee" },
    { sno: 5, avatar: "👤", name: "Mark Lee" },
    { sno: 5, avatar: "👤", name: "Mark Lee" },
    { sno: 5, avatar: "👤", name: "Mark Lee" },
    { sno: 5, avatar: "👤", name: "Mark Lee" },
  ];

  return (
    <div className="p-8 flex">
      {/* 3/4th width for input form */}
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
        <div className="mb-4">
          <FileUploadCreation />
        </div>
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

      {/* 1/4th width for right-side options */}
      <div className="w-1/4">
        <h2 className="text-lg font-bold">Overall Deadline</h2>
        <DatePickerWithPresets />

        <h2 className="text-lg font-bold mt-4">Assign Reviewers</h2>
        <ComboboxDemo />

        <h2 className="text-lg font-bold mt-4">Assign Students</h2>
        <ComboboxDemo />

        <h2 className="text-lg font-bold mt-4">Assign Group</h2>
        <ComboboxDemo />

        <h2 className="text-lg font-bold mt-4">Assigned Candidates</h2>
        <div className="overflow-y-scroll h-[17rem] mt-2 border border-gray-300 rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Avatar</TableHead>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.sno}>
                  <TableCell>{candidate.sno}</TableCell>
                  <TableCell>{candidate.avatar}</TableCell>
                  <TableCell>{candidate.name}</TableCell>
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
