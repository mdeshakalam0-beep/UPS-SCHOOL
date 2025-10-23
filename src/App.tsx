import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ObjectiveTestPage from "./pages/ObjectiveTestPage";
import SubjectiveTestPage from "./pages/SubjectiveTestPage";
import RecordedClassPage from "./pages/RecordedClassPage";
import LiveClassPage from "./pages/LiveClassPage";
import ResultsPage from "./pages/ResultsPage";
import NotesPdfPage from "./pages/NotesPdfPage";
import DobitBoxPage from "./pages/DobitBoxPage";
import ProfilePage from "./pages/ProfilePage"; // Import ProfilePage
import NotFound from "./pages/NotFound";
import { SessionContextProvider } from "./components/SessionContextProvider"; // Import SessionContextProvider

// Admin Module Pages
import ManageStudentsPage from "./pages/admin/ManageStudentsPage";
import ManageNotesPage from "./pages/admin/ManageNotesPage";
import ManageObjectiveTestsPage from "./pages/admin/ManageObjectiveTestsPage";
import ManageSubjectiveTestsPage from "./pages/admin/ManageSubjectiveTestsPage";
import ResolveDobitsPage from "./pages/admin/ResolveDobitsPage";
import ViewResultsPage from "./pages/admin/ViewResultsPage";
import ManageBannersNotificationsPage from "./pages/admin/ManageBannersNotificationsPage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Wrap routes with SessionContextProvider */}
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/student-dashboard" element={<StudentDashboardPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/objective-test" element={<ObjectiveTestPage />} />
            <Route path="/subjective-test" element={<SubjectiveTestPage />} />
            <Route path="/recorded-class" element={<RecordedClassPage />} />
            <Route path="/live-class" element={<LiveClassPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/notes-pdf" element={<NotesPdfPage />} />
            <Route path="/dobit-box" element={<DobitBoxPage />} />
            <Route path="/profile" element={<ProfilePage />} /> {/* New Profile Route */}

            {/* Admin Module Routes (can be nested under /admin-dashboard if desired, but for now direct routes) */}
            <Route path="/admin/manage-students" element={<ManageStudentsPage />} />
            <Route path="/admin/manage-notes" element={<ManageNotesPage />} />
            <Route path="/admin/manage-objective-tests" element={<ManageObjectiveTestsPage />} />
            <Route path="/admin/manage-subjective-tests" element={<ManageSubjectiveTestsPage />} />
            <Route path="/admin/resolve-dobits" element={<ResolveDobitsPage />} />
            <Route path="/admin/view-results" element={<ViewResultsPage />} />
            <Route path="/admin/manage-banners-notifications" element={<ManageBannersNotificationsPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;