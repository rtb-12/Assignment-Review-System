"use client";
import { CardStack } from "../ui/card-stack";
import { cn } from "../../lib/utils";

export function CardStackHome() {
  return (
    <div className="h-[40rem] flex items-center justify-center w-full scaleFactor-2">
      <CardStack items={CARDS} offset={20} scaleFactor={0.1} />
    </div>
  );
}

// Small utility to highlight the content of specific section of a testimonial content
export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-700/[0.2] dark:text-emerald-500 px-1 py-0.5",
        className
      )}
    >
      {children}
    </span>
  );
};

const CARDS = [
  {
    id: 1,
    name: "User Registration and Authentication",
    designation: "Feature",
    content: (
      <p>
        Users can <Highlight>register and log in</Highlight> to the system,
        ensuring secure access to their assignments and workspaces.
      </p>
    ),
  },
  {
    id: 2,
    name: "Profile Management",
    designation: "Feature",
    content: (
      <p>
        Users can <Highlight>update their profile information</Highlight> to
        keep their details up-to-date.
      </p>
    ),
  },
  {
    id: 3,
    name: "Workspace Management",
    designation: "Feature",
    content: (
      <p>
        Users can <Highlight>create workspaces</Highlight>, generate invitation
        links, and join workspaces to collaborate with others.
      </p>
    ),
  },
  {
    id: 4,
    name: "Assignment Management",
    designation: "Feature",
    content: (
      <p>
        Users can <Highlight>create and manage assignments</Highlight> within a
        workspace, making it easy to keep track of tasks and deadlines.
      </p>
    ),
  },
];
