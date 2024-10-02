import React from "react";
import { Cover } from "../ui/cover";

export function HomePage() {
  return (
    <div className="flex items-start justify-start h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-4xl md:text-6xl lg:text-8xl font-semibold max-w-7xl text-left relative z-20 py-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-700 dark:from-neutral-800 dark:via-white dark:to-white">
        Now Create and <br />
        Review Assigments at <Cover>warp speed</Cover>
      </h1>
    </div>
  );
}
