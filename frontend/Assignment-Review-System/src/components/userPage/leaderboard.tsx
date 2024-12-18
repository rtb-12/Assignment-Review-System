import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import { FaMedal } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

interface ApiResponse {
  name: string;
  profile_image: string;
  points: number;
}

interface LeaderboardRowProps {
  sno: number;
  name: string;
  points: number;
  image: string;
}

const getMedalColor = (sno: number): string => {
  switch (sno) {
    case 1:
      return "text-yellow-500";
    case 2:
      return "text-gray-400";
    case 3:
      return "text-yellow-700";
    default:
      return "";
  }
};

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  sno,
  name,
  points,
  image,
}) => {
  const isTop3 = sno <= 3;
  return (
    <TableRow className="bg-white dark:bg-gray-800">
      <TableCell className="py-4 px-4 w-24">
        <div className="flex items-center">
          {isTop3 && (
            <FaMedal className={`mr-2 text-xl ${getMedalColor(sno)}`} />
          )}
          {sno}
        </div>
      </TableCell>
      <TableCell className="py-4 px-4 flex-1">
        <div className="flex items-center">
          <img
            src={image || "https://via.placeholder.com/32"}
            alt={name}
            className="w-8 h-8 rounded-full mr-2"
          />
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {name}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-4 px-4 w-32 text-right">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          {points}
        </span>
      </TableCell>
    </TableRow>
  );
};

const Leaderboard = () => {
  const workspaceId = useSelector(
    (state: RootState) => state.workspace.workspaceId
  );
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRowProps[]>(
    []
  );

  useEffect(() => {
    if (!workspaceId) {
      console.log("Workspace ID is not available yet.");
      return;
    }

    axios
      .get(`http://localhost:8000/api/workspace/${workspaceId}/leaderboard/`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("access")}`,
        },
      })
      .then((response) => {
        // Sort by points in descending order and transform data
        const transformedData: LeaderboardRowProps[] = response.data
          .sort((a: ApiResponse, b: ApiResponse) => b.points - a.points)
          .map((entry: ApiResponse, index: number) => ({
            sno: index + 1,
            name: entry.name,
            points: entry.points,
            image: entry.profile_image,
          }));
        setLeaderboardData(transformedData);
      })
      .catch((error) => {
        console.error(
          "There was an error fetching the leaderboard data!",
          error
        );
      });
  }, [workspaceId]);

  return (
    <div className="p-6 max-w-3xl mx-auto shadow-md rounded-lg bg-gray-50 dark:bg-gray-900">
      <h2 className="text-4xl font-bold mb-6 text-center text-gray-800 dark:text-gray-50">
        Leaderboard
      </h2>
      <Table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <TableHeader>
          <TableRow className="bg-gray-200 dark:bg-gray-700">
            <TableHead className="w-24 px-4 py-3">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-50">
                Rank
              </span>
            </TableHead>
            <TableHead className="px-4 py-3 flex-1">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-50">
                Name
              </span>
            </TableHead>
            <TableHead className="w-32 px-4 py-3 text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-50">
                Points
              </span>
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
