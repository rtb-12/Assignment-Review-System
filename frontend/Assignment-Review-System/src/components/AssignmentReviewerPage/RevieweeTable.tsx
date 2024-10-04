import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const users = [
  {
    sno: 1,
    avatar: "https://via.placeholder.com/40",
    name: "John Doe",
    status: "Active",
    points: 150,
  },
  {
    sno: 2,
    avatar: "https://via.placeholder.com/40",
    name: "Jane Smith",
    status: "Inactive",
    points: 120,
  },
  {
    sno: 3,
    avatar: "https://via.placeholder.com/40",
    name: "Alice Johnson",
    status: "Active",
    points: 100,
  },
  {
    sno: 4,
    avatar: "https://via.placeholder.com/40",
    name: "Bob Brown",
    status: "Active",
    points: 90,
  },
  {
    sno: 5,
    avatar: "https://via.placeholder.com/40",
    name: "Charlie Davis",
    status: "Inactive",
    points: 80,
  },
  {
    sno: 6,
    avatar: "https://via.placeholder.com/40",
    name: "David Evans",
    status: "Active",
    points: 70,
  },
  {
    sno: 7,
    avatar: "https://via.placeholder.com/40",
    name: "Eve Foster",
    status: "Inactive",
    points: 60,
  },
];

const RevieweeTable = () => {
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
          {users.map((user) => (
            <TableRow key={user.sno} className="border-b last:border-none">
              <TableCell className="p-4">{user.sno}</TableCell>
              <TableCell className="p-4">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="p-4">{user.name}</TableCell>
              <TableCell className="p-4">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    user.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="p-4">{user.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RevieweeTable;
