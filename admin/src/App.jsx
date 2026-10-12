// App.jsx: the top of the component tree and the page routing.
// React Router changes which page is shown based on the URL, without reloading the site.
// Every page the admin can open is listed in <Gate /> below.
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

// Gate decides what to show, in this order:
// 1. Still checking who is signed in -> a loading message.
// 2. Nobody signed in -> the Login page.
// 3. Signed in but not an admin -> the NotAdmin page.
// 4. Admin -> the real dashboard pages (routes below).
// A component is just a function that returns the screen (JSX).
function Gate() {
  // useAuth() reads the login info shared by AuthProvider (see AuthContext.jsx).
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Login />;
  if (!isAdmin) return <NotAdmin />;

  // <Routes> picks the first <Route> that matches the current URL.
  // <Layout /> is the shared frame (sidebar + header). Its child page is drawn
  // where Layout puts <Outlet />. The "index" route is the home page at "/".
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="bins" element={<BinStatus />} />
        <Route path="users" element={<Users />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="orders" element={<Orders />} />
        {/* Any unknown URL is sent back to the home page. replace stops it filling the back button. */}
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
