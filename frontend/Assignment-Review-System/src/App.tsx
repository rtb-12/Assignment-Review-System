import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store/store";
import { fetchUserDetails } from "./features/auth/authSlice";
import { setIsAdmin } from "./features/workspace/workspaceSlice";
import TopBar from "./components/TopBar/TopBar";
import LoggedInTopBar from "./components/TopBar/LoggedInTopBar";
import SignUp from "./components/SignUp/SignUp";
import Login from "./components/Login/Login";
import Workspace from "./components/Workspace/workspace";
import UserPage from "./components/userPage/userPage";
import { HomePage } from "./components/HomePage/HomePage";
import AssignmentCreationPage from "./components/AssignmentCreationPage/AssignmentCreationPage";
import AssignmentSubmissionPage from "./components/AssignmentUserViewPage/AssignmetUserView";
import AssignmentdashboardPage from "./components/AssignmentDashboard/AssignmentDashboard";
import AssignmentReviewerCard from "./components/AssignmentReviewerPage/AssignmentReviewerCard";
import AssignmentReviewPage from "./components/AssignmentReviewerPage/AssignmentReviewPage";
import GroupManagement from "./components/GroupManagement/GroupManagement";
import OAuthCallback from "./components/OAuthCallback/OAuthCallback";
import "./App.css";
import axios from "axios";
import Cookies from "js-cookie";

const Home = () => <HomePage />;

function App() {
  const dispatch: AppDispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { workspaceId } = useSelector((state: RootState) => state.workspace);

  useEffect(() => {
    dispatch(fetchUserDetails());
  }, [dispatch]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/workspace/access/${workspaceId}/`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access")}`,
            },
          }
        );

        if (response.status === 200 && response.data.detail === "Admin view") {
          dispatch(setIsAdmin(true));
        } else {
          dispatch(setIsAdmin(false));
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        dispatch(setIsAdmin(false));
      }
    };

    if (workspaceId) {
      checkAdminStatus();
    }
  }, [dispatch, workspaceId]);

  return (
    <Router>
      <>
        {isAuthenticated ? <LoggedInTopBar /> : <TopBar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:workspaceId" element={<UserPage />} />
          <Route
            path="/workspace/:workspaceId/create-assignment"
            element={<AssignmentCreationPage />}
          />
          <Route
            path="/workspace/:workspaceId/assignment/:assignmentId"
            element={<AssignmentSubmissionPage />}
          />
          <Route
            path="/workspace/:workspaceId/assignment-dashboard"
            element={<AssignmentdashboardPage />}
          />
          <Route
            path="/workspace/:workspaceId/assignment/:assignmentId/assignment-reviewer"
            element={<AssignmentReviewerCard />}
          />
          <Route
            path="/workspace/:workspaceId/assignment/:assignmentId/assignment-reviewer/user/:revieweeId"
            element={<AssignmentReviewPage />}
          />
          <Route
            path="/workspace/:workspaceId/groupManagement"
            element={<GroupManagement />}
          />
          <Route path="/callback" element={<OAuthCallback />} />
        </Routes>
      </>
    </Router>
  );
}

export default App;
