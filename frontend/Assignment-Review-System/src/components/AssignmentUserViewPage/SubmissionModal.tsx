import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { FileUploadCreation } from "./FileUpload";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submissionData: {
    link: string;
    doc: string;
    files: File[];
  }) => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [link, setLink] = useState("");
  const [doc, setDoc] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = () => {
    const submissionData = { link, doc, files };
    console.log("Submission Data:", submissionData); // Log the object to the console
    onSubmit(submissionData); // Call the onSubmit prop with the submission object
    // Reset state after submission
    setLink("");
    setDoc("");
    setFiles([]);
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-lg w-full h-[80vh] max-w-5xl overflow-y-scroll">
        <h2 className="text-3xl font-bold mb-6">Submit Assignment</h2>
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Submission Link"
          className="mb-6"
        />
        <div className="flex mb-6">
          <div className="w-1/2 mr-4">
            <label className="block text-sm font-medium mb-2">
              Submission Document (Markdown format)
            </label>
            <Textarea
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              placeholder="# Heading\n## Subheading\nThis is a paragraph..."
              className="h-64"
            />
          </div>
          <div className="w-1/2 ml-4">
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div className="h-64 overflow-y-scroll p-4 bg-gray-100 dark:bg-gray-900 rounded-md">
              <ReactMarkdown>{doc}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Attachments</label>
          <FileUploadCreation setFiles={handleFileUpload} />
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} className="mr-4">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-500 text-white">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
