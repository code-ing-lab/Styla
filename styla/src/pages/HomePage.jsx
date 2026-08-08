import { useState } from "react";
import LandingHero from "../components/LandingHero.jsx";
import SurveyPage from "./SurveyPage.jsx";

export default function HomePage() {
  const [showSurvey, setShowSurvey] = useState(false);

  if (showSurvey) return <SurveyPage />;

  return <LandingHero onStart={() => setShowSurvey(true)} />;
}
