import { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [surveyAnswers, setSurveyAnswers] = useState(null);
  const [report, setReport] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [orderEmail, setOrderEmail] = useState(null);

  const resetAll = () => {
    setSurveyAnswers(null);
    setReport(null);
    setSelectedTier(null);
    setOrderEmail(null);
  };

  const value = useMemo(
    () => ({
      surveyAnswers,
      setSurveyAnswers,
      report,
      setReport,
      selectedTier,
      setSelectedTier,
      orderEmail,
      setOrderEmail,
      resetAll,
    }),
    [surveyAnswers, report, selectedTier, orderEmail]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
