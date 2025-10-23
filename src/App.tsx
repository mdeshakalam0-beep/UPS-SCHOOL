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
import RecordedClassPage from "./pages/RecordedClassPage"; // New import
import LiveClassPage from "./pages/LiveClassPage";         // New import
import ResultsPage from "./pages/ResultsPage";             // New import
import NotesPdfPage from "./pages/NotesPdfPage";           // New import
import DobitBoxPage from "./pages/DobitBoxPage";           // New import
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/student-dashboard" element={<StudentDashboardPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
          <Route path="/objective-test" element={<ObjectiveTestPage />} />
          <Route path="/subjective-test" element={<SubjectiveTestPage />} />
          <Route path="/recorded-class" element={<RecordedClassPage />} /> {/* New route */}
          <Route path="/live-class" element={<LiveClassPage />} />         {/* New route */}
          <Route path="/results" element={<ResultsPage />} />             {/* New route */}
          <Route path="/notes-pdf" element={<NotesPdfPage />} />           {/* New route */}
          <Route path="/dobit-box" element={<DobitBoxPage />} />           {/* New route */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;