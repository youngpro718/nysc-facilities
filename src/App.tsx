
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Spaces from "./pages/Spaces";
import Layout from "./components/layout/Layout";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect } from "react";
import { initializeStorage } from "./services/storage";

function App() {
  // Initialize required storage buckets when app loads
  useEffect(() => {
    // Initialize storage buckets and handle any initialization errors
    initializeStorage().catch(error => {
      console.error("Failed to initialize storage buckets:", error);
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Spaces />} />
            <Route path="spaces" element={<Spaces />} />
            {/* Add other routes as needed */}
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
