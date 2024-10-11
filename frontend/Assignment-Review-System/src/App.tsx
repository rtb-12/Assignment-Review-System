// frontend/Assignment-Review-System/src/App.tsx

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import TopBar from "./components/TopBar/TopBar";
import SignUp from "./components/SignUp/SignUp";
import Login from "./components/Login/Login";
import Workspace from "./components/Workspace/workspace";
import UserPage from "./components/userPage/userPage";
import { HomePage } from "./components/HomePage/HomePage";
import LoggedInTopBar from "./components/TopBar/LoggedInTopBar";
import AssignmentCreationPage from "./components/AssignmentCreationPage/AssignmentCreationPage";
import AssignmentSubmissionPage from "./components/AssignmentUserViewPage/AssignmetUserView";
import AssignmentdashboardPage from "./components/AssignmentDashboard/AssignmentDashboard";
import AssignmentReviewerCard from "./components/AssignmentReviewerPage/AssignmentReviewerCard";
import AssignmentReviewPage from "./components/AssignmentReviewerPage/AssignmentReviewPage";
import OAuthCallback from "./components/OAuthCallback/OAuthCallback";
import "./App.css";

const Home = () => <HomePage />;

const AuthConsumer = ({ children }) => {
  const auth = useAuth();
  return children(auth);
};

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <AuthConsumer>
            {({ isAuthenticated }) => (
              <>
                {isAuthenticated ? <LoggedInTopBar /> : <TopBar />}
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/workspace" element={<Workspace />} />
                  <Route
                    path="/workspace/:workspaceId"
                    element={<UserPage />}
                  />
                  <Route
                    path="/workspace/:workspaceId/create-assignment"
                    element={<AssignmentCreationPage />}
                  />
                  <Route
                    path="/assignment-submission"
                    element={<AssignmentSubmissionPage />}
                  />
                  <Route
                    path="/assignment-dashboard"
                    element={<AssignmentdashboardPage />}
                  />
                  <Route
                    path="/assignment-reviewer"
                    element={<AssignmentReviewerCard />}
                  />
                  <Route
                    path="/assignment-review"
                    element={<AssignmentReviewPage />}
                  />
                  <Route path="/callback" element={<OAuthCallback />} />
                </Routes>
              </>
            )}
          </AuthConsumer>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
