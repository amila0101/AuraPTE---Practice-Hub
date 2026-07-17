import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import TopNavbar from "./components/TopNavbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import PracticePage from "./pages/PracticePage";
import PracticeListPage from "./pages/PracticeListPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import VocabPage from "./pages/VocabPage";
import ShadowingPage from "./pages/ShadowingPage";
import MockTestPage from "./pages/MockTestPage";
import StudyMaterialsPage from "./pages/StudyMaterialsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import ForumPage from "./pages/ForumPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PredictionsPage from "./pages/PredictionsPage";
import CoursesPage from "./pages/CoursesPage";
import GuidesPage from "./pages/GuidesPage";

const queryClient = new QueryClient();

const noNavRoutes = ["/", "/login", "/signup", "/reset-password"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hideNav = noNavRoutes.includes(location.pathname);

  useEffect(() => {
    let title = "AuraPTE";
    const path = location.pathname;
    
    if (path === "/") title = "AuraPTE";
    else if (path.startsWith("/dashboard")) title = "Dashboard | AuraPTE";
    else if (path.startsWith("/practice-list")) title = "Practice | AuraPTE";
    else if (path.startsWith("/practice")) title = "Practice Exam | AuraPTE";
    else if (path.startsWith("/mock-test")) title = "Mock Tests | AuraPTE";
    else if (path.startsWith("/vocab")) title = "Vocab Book | AuraPTE";
    else if (path.startsWith("/shadowing")) title = "Shadowing | AuraPTE";
    else if (path.startsWith("/materials")) title = "Study Materials | AuraPTE";
    else if (path.startsWith("/analytics")) title = "Analytics | AuraPTE";
    else if (path.startsWith("/login")) title = "Log In | AuraPTE";
    else if (path.startsWith("/signup")) title = "Sign Up | AuraPTE";
    else if (path.startsWith("/settings")) title = "Settings | AuraPTE";
    
    document.title = title;
  }, [location.pathname]);

  if (hideNav) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen w-full">
        <TopNavbar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/practice/exam" element={<PracticePage />} />
            <Route path="/practice-list" element={<PracticeListPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/vocab" element={<VocabPage />} />
            <Route path="/shadowing" element={<ShadowingPage />} />
            <Route path="/mock-test" element={<MockTestPage />} />
            <Route path="/materials" element={<StudyMaterialsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:slug" element={<GuidesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </ProtectedRoute>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppLayout />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
