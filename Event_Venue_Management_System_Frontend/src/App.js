import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingLayout from "./layouts/LandingLayout";
import Login from "./pages/landing/Login";
import Signup from "./pages/landing/Signup";
import AuthLayout from "./layouts/AuthLayout";
import { Toaster } from "react-hot-toast";
import Phone from "./pages/landing/Phone";
import Otp from "./pages/landing/Otp";
import ProtectedRoute from "./components/ProtectedRoute";
import VeirfyEmail from "./pages/VerifyEmail";
import Landing from "./pages/landing/Landing";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import Create from "./pages/dashboard/Create";
import Events from "./pages/dashboard/Events";
import Event from "./pages/dashboard/Event";
import Account from "./pages/dashboard/Account";
import DashboardScreenLayout from "./layouts/DashboardScreenLayout";

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LandingLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Landing />} />
            <Route path="auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="phone" element={<Phone />} />
              <Route path="otp" element={<Otp />} />
            </Route>
          </Route>
          <Route
            path="/dashboard"
            element={
              <DashboardLayout />
            }
          >
            <Route path="create" element={<Create />} />
            <Route path="event/:id" element={<Event />} />
            <Route path="account" element={<Account />} />
            <Route
              path="events"
              element={
                <DashboardScreenLayout title={"Your Events"}>
                  <Events />
                </DashboardScreenLayout>
              }
            />
            <Route path="" element={<Dashboard />} />
          </Route>
          <Route path="/verify-email" element={<VeirfyEmail />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
