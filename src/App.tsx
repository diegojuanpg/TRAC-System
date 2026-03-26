import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useUser } from "@/context/UserContext";
import Index from "./pages/Index.tsx";
import MorningSurvey from "./pages/MorningSurvey.tsx";
import NutritionForm from "./pages/NutritionForm.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Redirects unauthenticated users to /login
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useUser();
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
      <Route path="/morning" element={<PrivateRoute><MorningSurvey /></PrivateRoute>} />
      <Route path="/nutrition" element={<PrivateRoute><NutritionForm /></PrivateRoute>} />
      
      {/* VERBOSE CATCH-ALL FOR DEBUGGING VERCEL */}
      <Route path="*" element={
        <div style={{ padding: 20, color: 'red', background: 'white' }}>
          <h2>ROUTING ERROR</h2>
          <p>Path not found: {window.location.pathname}</p>
          <pre>{JSON.stringify(window.location, null, 2)}</pre>
        </div>
      } />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <UserProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  </UserProvider>
);

export default App;
