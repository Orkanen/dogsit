import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Matches from "./components/Matches";
import Sitters from "./components/Sitters";
import Kennels from "./components/Kennels";
import KennelDetail from "./pages/KennelDetail";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import PetProfile from "./pages/PetProfile";
import CreatePet from "./pages/CreatePet";
import MyPets from "./pages/MyPets"

export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/kennels" element={<Kennels />} />
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}