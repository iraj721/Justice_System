import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TopNav } from "./shared/components/TopNav";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import { 
  HomePage, 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage,
  DashboardPage,
  TermsPage,
  PrivacyPage,
  BlockchainViewer
} from "./pages";
import { getToken } from "./shared/services/auth";

export function App() {
  const token = getToken();

  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        
        <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        
        <Route path="/blockchain" element={<ProtectedRoute><BlockchainViewer token={token!} /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}