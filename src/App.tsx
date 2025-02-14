
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Spaces from "@/pages/Spaces";
import Keys from "@/pages/Keys";
import Lighting from "@/pages/Lighting";
import Issues from "@/pages/Issues";
import Profile from "@/pages/Profile";
import AdminProfile from "@/pages/AdminProfile";
import UserDashboard from "@/pages/UserDashboard";
import Occupants from "@/pages/Occupants";
import NotFound from "@/pages/NotFound";
import Verification from "@/pages/Verification";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/keys" element={<Keys />} />
          <Route path="/lighting" element={<Lighting />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/occupants" element={<Occupants />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}
