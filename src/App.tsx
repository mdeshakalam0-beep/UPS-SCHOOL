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
import DobitBoxPage from "./pages/DobitBoxPage"; // This will now handle redirection
import DobitSubmissionPage from "./pages/DobitSubmissionPage"; // New student submission page
import ProfilePage from "./pages/ProfilePage";
import NoteViewerPage from "./pages/NoteViewerPage";
import RecordedVideoViewerPage from "./pages/RecordedVideoViewerPage";
import NotFound from "./pages/NotFound";
import { SessionContextProvider } from "./components/SessionContextProvider";

// Admin Module Pages
import ManageStudentsPage from "./pages/admin/ManageStudentsPage";
import ManageNotesPage from "./pages/admin/ManageNotesPage";
import ManageObjectiveTestsPage from "./pages/admin/ManageObjectiveTestsPage";
import ManageSubjectiveTestsPage from "./pages/admin/ManageSubjectiveTestsPage";
import ResolveDobitsPage from "./pages/admin/ResolveDobitsPage"; // Updated admin resolve page
import ViewResultsPage from "./pages/admin/ViewResultsPage";
import ManageBannersNotificationsPage from "./pages/admin/ManageBannersNotificationsPage";
import ManageRecordedClassesPage from "./pages/admin/ManageRecordedClassesPage";
import ManageLiveClassesPage from "./pages/admin/ManageLiveClassesPage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
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
            <Route path="/dobit-box" element={<DobitBoxPage />} /> {/* This will redirect based on role */}
            <Route path="/dobit-box/submit" element={<DobitSubmissionPage />} /> {/* Student submission page */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/view-note/:noteId" element={<NoteViewerPage />} />
            <Route path="/view-recorded-class/:videoId" element={<RecordedVideoViewerPage />} />

            {/* Admin Module Routes */}
            <Route path="/admin/manage-students" element={<ManageStudentsPage />} />
            <Route path="/admin/manage-notes" element={<ManageNotesPage />} />
            <Route path="/admin/manage-recorded-classes" element={<ManageRecordedClassesPage />} />
            <Route path="/admin/manage-live-classes" element={<ManageLiveClassesPage />} />
            <Route path="/admin/manage-objective-tests" element={<ManageObjectiveTestsPage />} />
            <Route path="/admin/manage-subjective-tests" element={<ManageSubjectiveTestsPage />} />
            <Route path="/admin/resolve-dobits" element={<ResolveDobitsPage />} /> {/* Admin resolve page */}
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