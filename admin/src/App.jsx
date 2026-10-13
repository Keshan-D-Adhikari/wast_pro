import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import Login from "./pages/Login";
import NotAdmin from "./pages/NotAdmin";
import Layout from "./pages/Layout";
import Overview from "./pages/Overview";
import BinStatus from "./pages/BinStatus";
import Users from "./pages/Users";
import Marketplace from "./pages/Marketplace";
import Orders from "./pages/Orders";
import "./App.css";

// FUNCTION: Gate - runs when the admin site opens; shows Login, "Not an admin", or the admin pages.
function Gate() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Login />;
  if (!isAdmin) return <NotAdmin />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="bins" element={<BinStatus />} />
        <Route path="users" element={<Users />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="orders" element={<Orders />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// App wraps everything in the providers that other components need:
// BrowserRouter gives routing, AuthProvider gives the signed-in user to every page.
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
