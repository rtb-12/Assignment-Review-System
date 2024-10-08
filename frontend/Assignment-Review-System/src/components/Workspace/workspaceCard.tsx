"use client";
import React from "react";
import { cn } from "../../lib/utils";

interface WorkspaceCardProps {
  name: string;
  description: string;
  members: number;
  logo: string;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  name,
  description,
  members,
  logo,
}) => {
  return (
    <div className="w-full group/card">
      <div
        className={cn(
          "cursor-pointer overflow-hidden relative card rounded-md shadow-xl flex flex-col justify-between p-4 transition-transform duration-300 transform group-hover/card:scale-105",
          "bg-cover"
        )}
        style={{
          backgroundImage: `url(${logo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "20rem",
          width: "15rem",
        }}
      >
        {/* Dark tint overlay */}
        <div className="absolute w-full h-full top-0 left-0 bg-black opacity-20 group-hover/card:opacity-50 transition-opacity duration-300"></div>

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
