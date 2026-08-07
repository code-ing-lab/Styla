import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Moon, Settings, Sun, User } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { isLoggedIn, isPremium } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-cream-border dark:border-night-border bg-cream-card dark:bg-night-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-cream-text dark:text-night-text">
          Styla
        </Link>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link
                to="/mypage"
                className="flex items-center gap-1.5 rounded-full border border-cream-border px-3 py-2 text-xs font-medium text-cream-text hover:bg-cream-bg dark:border-night-border dark:text-night-text dark:hover:bg-night-bg"
              >
                <User size={14} />
                마이페이지
                {isPremium && <span className="text-accent-gold">·프리미엄</span>}
              </Link>
              <Link
                to="/settings"
                aria-label="설정"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-border text-cream-text hover:bg-cream-bg dark:border-night-border dark:text-night-text dark:hover:bg-night-bg"
              >
                <Settings size={16} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="로그아웃"
                className="flex items-center gap-1.5 rounded-full border border-cream-border px-3 py-2 text-xs font-medium text-cream-text hover:bg-cream-bg dark:border-night-border dark:text-night-text dark:hover:bg-night-bg"
              >
                <LogOut size={14} />
                로그아웃
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-cream-border px-3 py-2 text-xs font-medium text-cream-text hover:bg-cream-bg dark:border-night-border dark:text-night-text dark:hover:bg-night-bg"
            >
              로그인
            </Link>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="다크모드 전환"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-border dark:border-night-border text-cream-text dark:text-night-text hover:bg-cream-bg dark:hover:bg-night-bg transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
