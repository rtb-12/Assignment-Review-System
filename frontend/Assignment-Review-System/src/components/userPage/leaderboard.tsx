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

interface LeaderboardRowProps {
  sno: number;
  name: string;
  points: number;
  image: string;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  sno,
  name,
  points,
  image,
}) => {
  const isTop3 = sno <= 3;
  return (
    <TableRow className="bg-white dark:bg-gray-800">
      <TableCell className="text-sm flex items-center py-4 pl-4">
        {isTop3 && <FaMedal className={`mr-2 text-xl ${getMedalColor(sno)}`} />}
        {sno}
      </TableCell>
      <TableCell className="text-lg font-semibold py-4 text-gray-900 dark:text-gray-50 flex items-center">
        <img src={image} alt={name} className="w-8 h-8 rounded-full mr-2" />
        {name}
      </TableCell>
      <TableCell className="text-lg font-semibold py-4 text-right pr-4 text-gray-900 dark:text-gray-50">
        {points}
      </TableCell>
    </TableRow>
  );
};

const Leaderboard = () => {
  const workspaceId = useSelector(
    (state: RootState) => state.workspace.workspaceId
  );
  console.log("Fetched workspaceId from Redux store:", workspaceId);

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRowProps[]>(
    []
  );

  useEffect(() => {
    if (!workspaceId) {
      console.log("Workspace ID is not available yet.");
      return;
    }
    // Proceed with the API call if workspaceId exists
    console.log("useEffect triggered with workspace_id:", workspaceId);
    axios
      .get(`http://localhost:8000/api/workspace/${workspaceId}/leaderboard/`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("access")}`,
        },
      })
      .then((response) => {
        console.log("Request successful:", response.data);
        setLeaderboardData(response.data);
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
