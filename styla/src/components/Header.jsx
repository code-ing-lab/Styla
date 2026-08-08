import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4L17 17M7 7 5.6 5.6"
      />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"
      />
    </svg>
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-report-title text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            STYLA
          </span>
          <span className="eyebrow mt-1 text-[0.6rem] sm:text-[0.65rem]">
            Your Style Report
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="다크모드 전환"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-card text-text-primary transition hover:border-accent-green"
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}
