import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { FiClipboard } from "react-icons/fi"; // Import the clipboard icon from react-icons

interface SubmissionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionData?: {
    link: string;
    doc: string;
    files: string[];
  };
}

const SubmissionViewModal: React.FC<SubmissionViewModalProps> = ({
  isOpen,
  onClose,
  submissionData = { link: "", doc: "", files: [] }, // Default values
}) => {
  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(submissionData.link);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-lg w-full h-[80vh] max-w-5xl overflow-y-scroll">
        <h2 className="text-3xl font-bold mb-6">Submission Details</h2>

        {/* Submission Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Submission Link
          </label>
          <div className="flex items-center">
            <Input value={submissionData.link} readOnly className="w-full" />
            <FiClipboard
              className="h-6 w-6 text-gray-500 cursor-pointer ml-2"
              onClick={handleCopyLink}
            />
          </div>
        </div>

        {/* Submission Document Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Submission Document Preview
          </label>
          <div className="h-64 overflow-y-scroll p-4 bg-gray-100 dark:bg-gray-900 rounded-md">
            <ReactMarkdown>{submissionData.doc}</ReactMarkdown>
          </div>
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Attachments</label>
          <ul className="list-disc ml-5">
            {submissionData.files &&
              submissionData.files.map((file, index) => (
                <li key={index}>
                  <a
                    href={`http://localhost:8000/media/${file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {file.split("/").pop()}
                  </a>
                </li>
              ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="mr-4">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionViewModal;
