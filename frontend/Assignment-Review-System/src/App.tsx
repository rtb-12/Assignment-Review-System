import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TopBar from "./components/TopBar/TopBar";
import SignUp from "./components/SignUp/SignUp";
import Login from "./components/Login/Login";
import Workspace from "./components/Workspace/workspace";
import UserPage from "./components/userPage/userPage";
import { HomePage } from "./components/HomePage/HomePage";
import LoggedInTopBar from "./components/TopBar/LoggedInTopBar";
import AssignmentCreationPage from "./components/AssignmentCreationPage/AssignmentCreationPage";
import AssignmentSubmissionPage from "./components/AssignmentUserViewPage/AssignmetUserView";
import "./App.css";
import AssignmentdashboardPage from "./components/AssignmentDashboard/AssignmentDashboard";

function App() {
  return (
    <Router>
      <LoggedInTopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/userpage" element={<UserPage />} />
        <Route path="/create-assignment" element={<AssignmentCreationPage />} />
        <Route
          path="/assignment-submission"
          element={<AssignmentSubmissionPage />}
        />
        <Route
          path="  "
          element={<AssignmentdashboardPage />}
        />
      </Routes>
    </Router>
  );
}

const Home = () => <HomePage />;

export default App;
