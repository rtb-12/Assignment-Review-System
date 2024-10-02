import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table"; // Assuming you have a custom table component
import { FaMedal } from "react-icons/fa"; // Import medal icons

// Sample leaderboard data
const leaderboardData = [
  { sno: 1, name: "Alice", points: 150 },
  { sno: 2, name: "Bob", points: 120 },
  { sno: 3, name: "Charlie", points: 100 },
  { sno: 4, name: "Charles", points: 90 },
  // Add more data as needed
];

// Get medal color for the top 3
const getMedalColor = (sno: number): string => {
  switch (sno) {
    case 1:
      return "text-yellow-500"; // Gold
    case 2:
      return "text-gray-400"; // Silver
    case 3:
      return "text-yellow-700"; // Bronze
    default:
      return "";
  }
};

// Define the type for props of LeaderboardRow
interface LeaderboardRowProps {
  sno: number;
  name: string;
  points: number;
}

// LeaderboardRow component for modularity with explicit prop types
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  sno,
  name,
  points,
}) => {
  const isTop3 = sno <= 3;
  return (
    <TableRow className="bg-white dark:bg-gray-800">
      <TableCell className="text-sm flex items-center py-4 pl-4">
        {isTop3 && (
          <FaMedal
            className={`mr-2 text-xl ${getMedalColor(sno)}`} // Apply the color here
          />
        )}
        {sno}
      </TableCell>
      <TableCell className="text-lg font-semibold py-4 text-gray-900 dark:text-gray-50">
        {name}
      </TableCell>
      <TableCell className="text-lg font-semibold py-4 text-right pr-4 text-gray-900 dark:text-gray-50">
        {points}
      </TableCell>
    </TableRow>
  );
};

const Leaderboard = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto shadow-md rounded-lg bg-gray-50 dark:bg-gray-900">
      <h2 className="text-4xl font-bold mb-6 text-center text-gray-800 dark:text-gray-50">
        Leaderboard
      </h2>
      <Table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <TableHeader>
          <TableRow className="bg-gray-200 dark:bg-gray-700">
            <TableHead className="text-lg font-bold py-3 pl-4 text-gray-900 dark:text-gray-50">
              S.No
            </TableHead>
            <TableHead className="text-lg font-bold py-3 text-gray-900 dark:text-gray-50">
              Name
            </TableHead>
            <TableHead className="text-lg font-bold py-3 text-right pr-4 text-gray-900 dark:text-gray-50">
              Points
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboardData.map((entry) => (
            <LeaderboardRow key={entry.sno} {...entry} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Leaderboard;
