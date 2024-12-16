import React from "react";
import { useNavigate, useParams } from "react-router-dom";

interface AssignmentCardProps {
  assignment: {
    assignment_id: number;
    assignment_name: string;
    deadline: string;
  };
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const handleCardClick = () => {
    navigate(
      `/workspace/${workspaceId}/assignment/${assignment.assignment_id}/assignment-reviewer`
    );
  };

  return (
    <div onClick={handleCardClick} className="cursor-pointer">
      <div className="max-w-[20rem] w-full mx-auto p-8 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group">
        <div className="h-[15rem] md:h-[20rem] rounded-xl z-40 bg-neutral-300 dark:bg-[rgba(40,40,40,0.70)] [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]">
          <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
            <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
              <div className="h-8 w-8 circle-1">
                <div className="h-4 w-4 " />
              </div>
              <div className="h-12 w-12 circle-2">
                <div className="h-6 w-6 dark:text-white" />
              </div>
              <div className="circle-3">
                <div className="h-8 w-8 dark:text-white" />
              </div>
              <div className="h-12 w-12 circle-4">
                <div className="h-6 w-6 " />
              </div>
              <div className="h-8 w-8 circle-5">
                <div className="h-4 w-4 " />
              </div>
            </div>
            <div className="h-40 w-px absolute top-20 m-auto z-40 bg-gradient-to-b from-transparent via-cyan-500 to-transparent animate-move">
              <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10">
                <div />
              </div>
            </div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white py-2">
          {assignment.assignment_name}
        </h3>
        <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400 max-w-sm">
          <p>ID: {assignment.assignment_id}</p>
          <p>Due Date: {new Date(assignment.deadline).toLocaleString()}</p>
        </p>
      </div>
    </div>
  );
}
