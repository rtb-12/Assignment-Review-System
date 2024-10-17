import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { cn } from "../../lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "../ui/table";
import { Button } from "../ui/button";
import Modal from "../ui/Modal";
import { setGroupId } from "../../features/group/groupSlice";
import axios from "axios";
import Cookies from "js-cookie";
import { ComboboxDemo } from "./ComboBox";

interface GroupCardProps {
  id: number;
  name: string;
  logo: string;
  members: { username: string; avatar: string; userID: number }[];
  allMembers: { id: number; name: string; username: string }[];
}

interface Person {
  id: number;
  name: string;
  username: string;
}

const GroupCard: React.FC<GroupCardProps> = ({
  id,
  name,
  logo,
  members,
  allMembers,
}) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Person[]>([]);

  const handleCardClick = () => {
    dispatch(setGroupId(id.toString()));
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (userID: number) => {
    try {
      const response = await axios.delete(`/api/group/${id}/remove-member/`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("access")}`,
          "Content-Type": "application/json",
        },
        data: { userID },
      });
      if (response.status === 204) {
        console.log("Member removed successfully");
        // Optionally, update the members list in the state
      }
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleAddMember = async () => {
    if (selectedMembers.length === 0) return;

    try {
      const response = await axios.post(
        `/api/group/${id}/add-member/`,
        { userID: selectedMembers[0].id },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 201) {
        console.log("Member added successfully");
        // Optionally, update the members list in the state
      }
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  return (
    <div>
      <div className="w-full group/card" onClick={handleCardClick}>
        <div
          className={cn(
            "cursor-pointer overflow-hidden relative card rounded-md shadow-xl flex flex-col justify-between p-4 transition-transform duration-300 transform group-hover/card:scale-105",
            "bg-cover"
          )}
          style={{
            backgroundImage: `url(${logo})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "18rem",
            width: "16rem",
          }}
        >
          <div className="absolute w-full h-full top-0 left-0 bg-black opacity-30 group-hover/card:opacity-50 transition-opacity duration-300"></div>

          <div className="flex flex-col z-10 text-gray-50 relative">
            <h1 className="font-bold text-lg md:text-xl lg:text-2xl">{name}</h1>

            <p className="font-normal text-sm my-2">{members.length} members</p>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">{name} - Members</h2>
          <p className="text-lg mb-4">{members.length} Members</p>

          <Table className="w-full text-left">
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="p-4">Avatar</TableHead>
                <TableHead className="p-4">Username</TableHead>
                <TableHead className="p-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member, index) => (
                <TableRow key={index} className="border-b last:border-none">
                  <TableCell className="p-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} alt={member.username} />
                      <AvatarFallback>
                        {member.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="p-4">{member.username}</TableCell>
                  <TableCell className="p-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteMember(member.userID)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <ComboboxDemo
              options={allMembers}
              selectedOptions={selectedMembers}
              setSelectedOptions={setSelectedMembers}
            />
            <Button className="ml-2 mt-2" onClick={handleAddMember}>
              Add Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupCard;
