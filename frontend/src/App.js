import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Analyze from "@/pages/Analyze";
import History from "@/pages/History";
import AnalysisDetail from "@/pages/AnalysisDetail";
import PolicePortal from "@/pages/PolicePortal";
import AnalyzerPortal from "@/pages/AnalyzerPortal";

function App() {
  return (
    <div className="App" data-testid="app-root">
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" theme="dark" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analyze" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisDetail /></ProtectedRoute>} />
            <Route path="/police" element={<ProtectedRoute roles={["police"]}><PolicePortal /></ProtectedRoute>} />
            <Route path="/analyzer" element={<ProtectedRoute roles={["analyzer"]}><AnalyzerPortal /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
