import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"; // Using alias path

// Application Pages & Layouts (Adjusted to use alias paths for consistency)
import Index from "@/pages/Index";
import ClientPortal from "@/pages/ClientPortal";
import NotFound from "@/pages/NotFound";

// Assume these exist for the dashboard structure
import DashboardLayout from "@/layouts/DashboardLayout"; 
import ProtectedRoute from "@/routes/ProtectedRoute"; 
import LeadsPage from "@/pages/LeadsPage"; 
import ProjectsPage from "@/pages/ProjectsPage"; 
import UsersPage from "@/pages/UsersPage";
import ProjectDetailsPage from "@/pages/ProjectDetails"; // <-- NEW IMPORT

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/client-portal" element={<ClientPortal />} />

            {/* Protected Dashboard Routes (Requires authentication via ProtectedRoute) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              {/* Default dashboard redirect */}
              <Route index element={<Navigate to="/dashboard/projects" replace />} />
              
              {/* Main Dashboard Pages */}
              <Route path="users" element={<UsersPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              
              {/* --- DYNAMIC PROJECT DETAIL ROUTE (MANDATORY) --- */}
              {/* This is the route that loads the multi-stage view we are building */}
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
