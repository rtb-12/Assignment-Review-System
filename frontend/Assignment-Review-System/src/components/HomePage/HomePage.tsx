import React from "react";
import { Cover } from "../ui/cover";
import { CardStackHome } from "./HomeScreenCard";

export function HomePage() {
  return (
    <div className="flex flex-col md:flex-row  justify-between min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-start md:items-start text-center md:text-left">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-semibold max-w-7xl py-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-700 dark:from-neutral-800 dark:via-white dark:to-white">
          Now Create and <br />
          Review Assignments
          <br /> at <Cover>warp speed</Cover>
        </h1>
      </div>

      {/* Card stack */}
      <div className="flex items-center justify-center w-full mt-8 md:mt-0 md:w-auto">
        <CardStackHome />
      </div>
    </div>
  );
}
