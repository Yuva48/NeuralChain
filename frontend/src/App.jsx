import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import PageLoader from "./components/PageLoader.jsx";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home.jsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.jsx"));
const ModelDetail = lazy(() => import("./pages/ModelDetail.jsx"));
const Upload = lazy(() => import("./pages/Upload.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Compare = lazy(() => import("./pages/Compare.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Governance = lazy(() => import("./pages/Governance.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.jsx"));
const Wallet = lazy(() => import("./pages/Wallet.jsx"));

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}



export default function App() {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/model/:id" element={<ModelDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/governance" element={<ProtectedRoute><Governance /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </>
  );
}
