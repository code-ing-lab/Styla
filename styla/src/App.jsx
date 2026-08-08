import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import DevPanel from "./components/DevPanel.jsx";
import HomePage from "./pages/HomePage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import AdditionalInfoPage from "./pages/AdditionalInfoPage.jsx";
import FullReportPage from "./pages/FullReportPage.jsx";
import { isDevModeEnabled, syncDevModeFromUrl } from "./lib/devMode.js";

function Layout({ children }) {
  const [devMode, setDevMode] = useState(isDevModeEnabled);

  useEffect(() => {
    setDevMode(syncDevModeFromUrl());
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <Header />
      <main>{children}</main>
      {devMode && <DevPanel />}
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/additional-info" element={<AdditionalInfoPage />} />
        <Route path="/report/:tier" element={<FullReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
