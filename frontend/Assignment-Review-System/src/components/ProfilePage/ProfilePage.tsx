// src/components/ProfilePage/ProfilePage.tsx
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { FiMail, FiUser } from "react-icons/fi";

const ProfilePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  console.log("user in profile ", user);
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white dark:bg-gray-800 shadow-xl">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={user.profile_pic || "https://via.placeholder.com/150"}
                  alt={user.username}
                />
                <AvatarFallback className="text-2xl">
                  {user.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.username}
              </h1>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FiUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FiMail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Points
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {user.points || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {}}
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
