// src/App.jsx — FINAL VERSION (YOUR WAY)
import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Sitters from "./pages/Sitters";
import Kennels from "./pages/Kennels";
import KennelDetail from "./pages/KennelDetail";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import PetPublicProfile from "./pages/PetPublicProfile";
import CreatePet from "./pages/CreatePet";
import MyPets from "./pages/MyPets";
import EditPet from "./pages/EditPet";
import KennelDashboard from "./pages/KennelDashboard";
import KennelCreate from "./pages/KennelCreate";
import KennelPetRequests from "./pages/KennelPetRequests";
import MyPetProfile from "./pages/MyPetProfile";
import SitterPublicProfile from "./pages/SitterPublicProfile";
import ClubDashboard from "./pages/ClubDashboard";
import ClubPage from "./pages/ClubPage";
import Clubs from "./pages/Clubs";
import ClubCreate from "./pages/ClubCreate";
import AccessDenied from "./pages/AccessDenied";

export default function App() {
  return (
    <Routes>

      {/* PUBLIC — anyone */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/kennel" element={<Kennels />} />
        <Route path="/kennel/:id" element={<KennelDetail />} />
        <Route path="/club/:id" element={<ClubPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pets/:id" element={<PetPublicProfile />} />
        <Route path="/sitters" element={<Sitters />} />
        <Route path="/sitter/:id" element={<SitterPublicProfile />} />
        <Route path="/clubs" element={<Clubs />} />
      </Route>

      {/* PROTECTED — login required, but NO role checks */}
      <Route element={<ProtectedLayout />}>
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/pets/my" element={<MyPets />} />
        <Route path="/pets/new" element={<CreatePet />} />
        <Route path="/pets/:id/edit" element={<EditPet />} />
        <Route path="/my-pets/:id" element={<MyPetProfile />} />

        {/* DASHBOARDS & CREATE PAGES — open to logged-in users */}
        <Route path="/kennel/dashboard" element={<KennelDashboard />} />
        <Route path="/kennel/create" element={<KennelCreate />} />
        <Route path="/kennel/requests/pet" element={<KennelPetRequests />} />

        <Route path="/club/dashboard" element={<ClubDashboard />} />
        <Route path="/club/create" element={<ClubCreate />} />

        <Route path="/access-denied" element={<AccessDenied />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}