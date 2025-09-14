import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import Pages
import LandingPage from "./pages/LandingPage";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";
import UserDashboard from "./pages/UserDashboard";
import ClaimUpload from "./pages/ClaimUpload";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyClaims from "./pages/CompanyClaims";
import CustomerRegistration from "./pages/CustomerRegistration";
import ClaimsList from "./pages/ClaimsList";


function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* User Routes */}
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/user-signup" element={<UserSignup />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/upload-claim" element={<ClaimUpload />} />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/company-claims/:id" element={<CompanyClaims />} />
        <Route path="/customer-registration" element={<CustomerRegistration />} />
        <Route path="/claims-list" element={<ClaimsList />} />
        
      </Routes>
    </Router>
  );
}

export default App;
