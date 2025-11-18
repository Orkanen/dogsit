import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
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
import PetProfile from "./pages/PetProfile";
import CreatePet from "./pages/CreatePet";
import MyPets from "./pages/MyPets";
import EditPet from "./pages/EditPet"
import KennelDashboard from "./pages/KennelDashboard";
import KennelCreate from "./pages/KennelCreate";

export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/kennel" element={<Kennels />} />
        <Route path="/kennel/:id" element={<KennelDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pets/:id" element={<PetProfile />} />
      </Route>

      {/* PROTECTED */}
      <Route element={<ProtectedLayout />}>
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/sitters" element={<Sitters />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/pets/my" element={<MyPets />} />
        <Route path="/pets/new" element={<CreatePet />} />
        <Route path="/pets/:id/edit" element={<EditPet />} />
        <Route path="/kennel/dashboard" element={<KennelDashboard />} />
        <Route path="/kennel/create" element={<KennelCreate />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}