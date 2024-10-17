"use client";
import React from "react";
import { FileUpload } from "../../components/ui/file-upload";

export function FileUploadCreation({
  setFiles,
}: {
  setFiles: (files: File[]) => void;
}) {
  const handleFileUpload = (files: File[]) => {
    setFiles(files);
    console.log(files);
  };

  return (
    <div className="w-full max-w-3/4 mx-auto min-h-[16rem] border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
      <FileUpload onChange={handleFileUpload} />
    </div>
  );
}
