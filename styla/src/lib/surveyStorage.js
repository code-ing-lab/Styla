const SURVEY_KEY = "styla_survey_answers";
const LAST_REPORT_KEY = "styla_last_report";

// 재방문자를 위한 저장/재사용 유틸. localStorage 접근은 항상 try/catch로 감싸서
// 프라이빗 브라우징 등으로 storage가 막혀 있어도 앱이 죽지 않게 한다.

// 저장: 미니 설문(3-1) 완료 시 호출
export function saveSurveyAnswers(answers) {
  try {
    window.localStorage.setItem(SURVEY_KEY, JSON.stringify(answers));
  } catch {
    // storage 접근 불가 시 조용히 무시
  }
}

export function getSavedSurveyAnswers() {
  try {
    const raw = window.localStorage.getItem(SURVEY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// 마지막으로 결제까지 완료해 생성된 전체 리포트 캐싱 — "지난번 리포트 다시 보기"용
export function saveLastReport(reportData, tier, surveyAnswers) {
  try {
    window.localStorage.setItem(
      LAST_REPORT_KEY,
      JSON.stringify({ report: reportData, tier, surveyAnswers })
    );
  } catch {
    // storage 접근 불가 시 조용히 무시
  }
}

export function getLastReport() {
  try {
    const raw = window.localStorage.getItem(LAST_REPORT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
