"use client";
import React from "react";
import { cn } from "../../lib/utils";

interface WorkspaceCardProps {
  name: string;
  description: string;
  members: number;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  name,
  description,
  members,
}) => {
  return (
    <div className="w-full group/card">
      <div
        className={cn(
          "cursor-pointer overflow-hidden relative card rounded-md shadow-xl flex flex-col justify-between p-4 transition-transform duration-300 transform group-hover/card:scale-105",
          "bg-[url(https://images.unsplash.com/photo-1544077960-604201fe74bc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1651&q=80)] bg-cover"
        )}
        style={{
          height: "20rem", // Default height for mobile
          width: "15rem", // Default width for mobile
        }}
      >
        {/* Overlay for hover effect */}
        <div className="absolute w-full h-full top-0 left-0 transition duration-300 group-hover/card:bg-black opacity-60"></div>

        {/* Card Content */}
        <div className="flex flex-col z-10">
          <h1 className="font-bold text-lg md:text-xl lg:text-2xl text-gray-50 relative z-10">
            {name}
          </h1>
          <p className="font-normal text-sm text-gray-50 relative z-10 my-2">
            {description}
          </p>
          <p className="font-normal text-xs md:text-sm text-gray-50 relative z-10">
            Members: {members}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCard;
