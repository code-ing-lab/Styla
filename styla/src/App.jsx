import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import SurveyPage from "./pages/SurveyPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import FullReportPage from "./pages/FullReportPage.jsx";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <Header />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SurveyPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/report/:tier" element={<FullReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
