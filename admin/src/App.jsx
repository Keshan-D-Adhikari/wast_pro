import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import Login from "./pages/Login";
import NotAdmin from "./pages/NotAdmin";
import Layout from "./pages/Layout";
import BinStatus from "./pages/BinStatus";
import Users from "./pages/Users";
import Marketplace from "./pages/Marketplace";
import Orders from "./pages/Orders";
import "./App.css";

function Gate() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Login />;
  if (!isAdmin) return <NotAdmin />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BinStatus />} />
        <Route path="users" element={<Users />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="orders" element={<Orders />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
