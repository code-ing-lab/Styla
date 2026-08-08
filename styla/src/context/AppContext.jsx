import { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [surveyAnswers, setSurveyAnswers] = useState(null);
  const [report, setReport] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [orderEmail, setOrderEmail] = useState(null);
  const [detailInfo, setDetailInfo] = useState(null);

  const resetAll = () => {
    setSurveyAnswers(null);
    setReport(null);
    setSelectedTier(null);
    setOrderEmail(null);
    setDetailInfo(null);
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
      detailInfo,
      setDetailInfo,
      resetAll,
    }),
    [surveyAnswers, report, selectedTier, orderEmail, detailInfo]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
