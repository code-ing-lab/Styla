import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { getTierById } from "../lib/tiers.js";
import PlaceholderImage from "../components/PlaceholderImage.jsx";

const SEASON_ORDER = ["봄", "여름", "가을", "겨울"];

const GRID_COLS_CLASS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

function ItemGrid({ items, cols = 3 }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${GRID_COLS_CLASS[cols]}`}>
      {items.map((item) => (
        <div key={item}>
          <PlaceholderImage label={item} />
          <p className="mt-2 text-center text-xs text-text-primary">{item}</p>
        </div>
      ))}
    </div>
  );
}

function SeasonSection({ season, look, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight ? "border-accent-gold" : "border-border-subtle"
      }`}
    >
      <p className="eyebrow">Season</p>
      <h3 className="mt-1 font-report-title text-lg font-semibold text-text-primary">
        {season}
        {highlight && (
          <span className="ml-2 align-middle text-xs font-medium text-accent-gold">
            현재 계절
          </span>
        )}
      </h3>
      <div className="mt-4">
        <ItemGrid items={look.items} cols={4} />
      </div>
      <p className="mt-3 text-sm text-text-secondary">{look.tip}</p>
    </div>
  );
}

function TpoSection({ tpo, look }) {
  return (
    <div className="rounded-2xl border border-border-subtle p-5">
      <p className="eyebrow">TPO</p>
      <h3 className="mt-1 font-report-title text-lg font-semibold text-text-primary">
        {tpo}
      </h3>
      <div className="mt-4">
        <ItemGrid items={look.items} cols={3} />
      </div>
      <p className="mt-3 text-sm text-text-secondary">{look.tip}</p>
    </div>
  );
}

export default function FullReportPage() {
  const { tier: tierParam } = useParams();
  const navigate = useNavigate();
  const { report, surveyAnswers } = useApp();
  const tier = getTierById(tierParam);
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!report || !surveyAnswers) {
      navigate("/", { replace: true });
    } else if (!tier) {
      navigate("/result", { replace: true });
    }
  }, [report, surveyAnswers, tier, navigate]);

  const seasonsToShow = useMemo(() => {
    if (!surveyAnswers) return [];
    if (tier?.id === "tier1") return [surveyAnswers.currentSeason];
    return SEASON_ORDER;
  }, [tier, surveyAnswers]);

  const tposToShow = useMemo(() => {
    if (!surveyAnswers || !report) return [];
    if (tier?.id === "tier3") return Object.keys(report.looksByTpo);
    return [surveyAnswers.tpo];
  }, [tier, surveyAnswers, report]);

  if (!report || !surveyAnswers || !tier) return null;

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const el = reportRef.current;
      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Styla_${tier.name}_리포트.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <span className="eyebrow">Your Style Report</span>
          <h1 className="mt-2 font-report-title text-3xl font-semibold">
            {tier.name}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="rounded-2xl bg-accent-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-green-dark disabled:opacity-60"
        >
          {isExporting ? "PDF 생성 중..." : "PDF 다운로드"}
        </button>
      </div>

      <div ref={reportRef} className="space-y-10 bg-surface p-1">
        <section className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
          <span className="eyebrow">Step 1</span>
          <h2 className="font-report-title text-xl font-semibold sm:text-2xl">
            체형 &amp; 분위기 분석
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-primary">
            {report.bodyType.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {report.bodyType.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-sm text-text-secondary"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
          <span className="eyebrow">Color Palette</span>
          <h2 className="font-report-title text-xl font-semibold sm:text-2xl">
            어울리는 컬러 팔레트
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {report.colorPalette.map((color) => (
              <div
                key={color.name}
                className="rounded-2xl border border-border-subtle bg-surface p-4"
              >
                <div
                  className="mb-3 h-16 w-full rounded-xl"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="text-sm font-semibold text-text-primary">{color.name}</p>
                <p className="mt-1 text-xs text-text-secondary">{color.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
          <span className="eyebrow">Season Look</span>
          <h2 className="font-report-title text-xl font-semibold sm:text-2xl">
            {tier.id === "tier1" ? `${surveyAnswers.currentSeason} 추천 룩` : "사계절 추천 룩"}
          </h2>
          <div className="mt-4 space-y-4">
            {seasonsToShow.map((season) => (
              <SeasonSection
                key={season}
                season={season}
                look={report.looksBySeason[season]}
                highlight={season === surveyAnswers.currentSeason}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
          <span className="eyebrow">TPO Look</span>
          <h2 className="font-report-title text-xl font-semibold sm:text-2xl">
            {tier.id === "tier3" ? "모든 TPO 추천 룩" : `${surveyAnswers.tpo} 추천 룩`}
          </h2>
          <div className="mt-4 space-y-4">
            {tposToShow.map((tpo) => (
              <TpoSection key={tpo} tpo={tpo} look={report.looksByTpo[tpo]} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
          <span className="eyebrow">Summary</span>
          <h2 className="font-report-title text-xl font-semibold sm:text-2xl">
            최종 요약
          </h2>
          <p className="mt-4 text-base text-text-primary">{report.summary.oneLiner}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {report.summary.keyFormulas.map((formula) => (
              <li key={formula}>{formula}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
