import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams, useNavigate } from "react-router-dom";

interface Reviewee {
  sno: number;
  avatar: string;
  name: string;
  status: string;
  points: number;
  user_id: number; // Add user_id to the Reviewee interface
}

const RevieweeTable = () => {
  const { workspaceId, assignmentId } = useParams<{
    workspaceId: string;
    assignmentId: string;
  }>();
  const navigate = useNavigate();

  const [reviewees, setReviewees] = useState<Reviewee[]>([]);

  useEffect(() => {
    const fetchReviewees = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/${workspaceId}/assignments/${assignmentId}/reviewees/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );
        const data = response.data.map((reviewee: any, index: number) => ({
          sno: index + 1,
          avatar: reviewee.profile_img,
          name: reviewee.name,
          status: reviewee.status,
          points: reviewee.points,
          user_id: reviewee.user_id,
        }));
        console.log("Reviewees:", data);
        setReviewees(data);
      } catch (error) {
        console.error("Error fetching reviewees:", error);
      }
    };

    fetchReviewees();
  }, [workspaceId, assignmentId]);

  const handleRowClick = (userId: number) => {
    console.log("User ID:", userId);
    navigate(
      `/workspace/${workspaceId}/assignment/${assignmentId}/assignment-reviewer/user/${userId}`
    );
  };

  return (
    <div className="p-8 bg-white shadow-lg rounded-lg w-full overflow-y-auto">
      <Table className="w-full text-left">
        <TableHeader className="bg-gray-200">
          <TableRow>
            <TableHead className="p-4 text-lg font-semibold">S.No</TableHead>
            <TableHead className="p-4 text-lg font-semibold">Avatar</TableHead>
            <TableHead className="p-4 text-lg font-semibold">Name</TableHead>
            <TableHead className="p-4 text-lg font-semibold">Status</TableHead>
            <TableHead className="p-4 text-lg font-semibold">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviewees.map((reviewee) => (
            <TableRow
              key={reviewee.sno}
              className="border-b last:border-none cursor-pointer"
              onClick={() => {
                console.log("Reviewee:", reviewee.user_id);
                handleRowClick(reviewee.user_id);
              }}
            >
              <TableCell className="p-4">{reviewee.sno}</TableCell>
              <TableCell className="p-4">
                <Avatar>
                  <AvatarImage src={reviewee.avatar} alt={reviewee.name} />
                  <AvatarFallback>{reviewee.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="p-4">{reviewee.name}</TableCell>
              <TableCell className="p-4">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    reviewee.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : reviewee.status === "started"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {reviewee.status}
                </span>
              </TableCell>
              <TableCell className="p-4">{reviewee.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RevieweeTable;
