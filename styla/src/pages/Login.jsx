import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isLoggedIn) navigate('/')
  }, [isLoggedIn, navigate])

  const signInWith = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) console.error(`${provider} 로그인 실패:`, error)
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)
    if (error) {
      setError('메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.')
      console.error('매직링크 로그인 실패:', error)
      return
    }
    setSent(true)
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">로그인</h1>
      <p className="mt-2 text-sm text-cream-subtext dark:text-night-text/70">
        로그인하면 하루 3회 코디 추천과 저장 기능을 이용할 수 있어요.
      </p>

      <button
        type="button"
        onClick={() => signInWith('kakao')}
        className="mt-8 w-full rounded-full bg-[#FEE500] px-6 py-3 text-sm font-semibold text-[#391B1B] transition-opacity hover:opacity-90"
      >
        카카오로 시작하기
      </button>
      <button
        type="button"
        onClick={() => signInWith('google')}
        className="mt-3 w-full rounded-full border border-cream-border bg-white px-6 py-3 text-sm font-semibold text-cream-text transition-opacity hover:opacity-90 dark:border-night-border dark:bg-night-card dark:text-night-text"
      >
        Google로 시작하기
      </button>

      <div className="mt-6 flex w-full items-center gap-3 text-xs text-cream-subtext dark:text-night-text/50">
        <span className="h-px flex-1 bg-cream-border dark:bg-night-border" />
        또는
        <span className="h-px flex-1 bg-cream-border dark:bg-night-border" />
      </div>

      {sent ? (
        <p className="mt-6 text-sm text-cream-text dark:text-night-text">
          <strong>{email}</strong>로 로그인 링크를 보냈어요. 메일함(스팸함 포함)을 확인해주세요.
        </p>
      ) : (
        <form onSubmit={handleMagicLink} className="mt-6 w-full">
          <label className="block text-left text-xs font-medium text-cream-subtext dark:text-night-text/70">
            이메일로 로그인
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-cream-border bg-cream-bg px-3 py-2 dark:border-night-border dark:bg-night-bg">
            <Mail size={16} className="shrink-0 text-cream-subtext dark:text-night-text/50" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm text-cream-text outline-none dark:text-night-text"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="mt-3 w-full rounded-full border border-cream-border px-6 py-3 text-sm font-semibold text-cream-text transition-opacity hover:opacity-90 disabled:opacity-50 dark:border-night-border dark:text-night-text"
          >
            {sending ? '전송 중...' : '로그인 링크 받기'}
          </button>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </form>
      )}
    </div>
  )
}
