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
  groupID: number;
  GroupName: string;
  groupProfileImage?: string;
  members?: Member[];
  allMembers: {
    user_id: number;
    name: string;
    email: string;
    profile_image: string | null;
  }[];
  description?: string;
}

interface Member {
  user_id: number;
  name: string;
  profile_image: string;
}

const GroupCard: React.FC<GroupCardProps> = ({
  groupID,
  GroupName,
  groupProfileImage = "",
  members = [],
  allMembers,
  description,
}) => {
  // Fix image URL processing
  const getImageUrl = (url: string) => {
    if (!url) return "https://via.placeholder.com/150";
    const cleanUrl = url.replace(/http:\/\/localhost:8000\/media\//g, "");
    return `http://localhost:8000/media/${cleanUrl}`;
  };

  // console.log(
  //   "GroupCardProps:",
  //   groupID,
  //   GroupName,
  //   groupProfileImage,
  //   members,
  //   allMembers
  // );

  const processedImageUrl = getImageUrl(groupProfileImage);
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Member[]>(members);
  const [selectedMembers, setSelectedMembers] = useState<Person[]>([]);

  const availableMembers = allMembers.filter(
    (member) =>
      !members.some((groupMember) => groupMember.user_id === member.user_id)
  );
  const handleCardClick = () => {
    dispatch(setGroupId(groupID.toString()));
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (userID: number) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/group/${groupID}/remove-member/`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "application/json",
          },
          data: { user_id: userID },
        }
      );
      if (response.status === 204) {
        console.log("Member removed successfully");
        window.location.reload();
        // setGroupMembers(
        //   groupMembers.filter((member) => member.user_id !== userID)
        // );
      }
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleAddMember = async () => {
    if (selectedMembers.length === 0) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/api/group/${groupID}/add-member/`,
        {
          groupID: groupID, // Add this
          userID: selectedMembers[0].user_id, // Change from .id to .user_id
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 201) {
        console.log("Member added successfully");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };
  const handleMemberSelect = (member: Member) => {
    console.log("Selected member:", member);
    setSelectedMembers((prevMembers) => [...prevMembers, member]);
  };

  const handleMemberRemove = (member: Member) => {
    setSelectedMembers((prevMembers) =>
      prevMembers.filter((prevMember) => prevMember.user_id !== member.user_id)
    );
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
            backgroundImage: `url(${processedImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "18rem",
            width: "16rem",
          }}
        >
          <div className="absolute w-full h-full top-0 left-0 bg-black opacity-30 group-hover/card:opacity-50 transition-opacity duration-300"></div>

          <div className="flex flex-col z-10 text-gray-50 relative">
            <h1 className="font-bold text-lg md:text-xl lg:text-2xl">
              {GroupName}
            </h1>

            {/* <p className="font-normal text-sm my-2">{members.length} members</p> */}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">{GroupName}</h2>
          <p className="text-lg mb-4">{description}</p>
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
              {members.map((member) => (
                <TableRow
                  key={member.user_id}
                  className="border-b last:border-none"
                >
                  <TableCell className="p-4">
                    <Avatar>
                      <AvatarImage
                        src={getImageUrl(member.profile_image)}
                        alt={member.name}
                      />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="p-4">{member.name}</TableCell>
                  <TableCell className="p-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteMember(member.user_id)}
                    >
                      Remove
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
              handleMemberSelect={handleMemberSelect}
              handleMemberRemove={handleMemberRemove}
            />
            <Button
              className="ml-2 mt-2"
              onClick={handleAddMember}
              disabled={selectedMembers.length === 0}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupCard;
