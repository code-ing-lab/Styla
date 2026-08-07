import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [signupSent, setSignupSent] = useState(false)

  useEffect(() => {
    if (isLoggedIn) navigate('/')
  }, [isLoggedIn, navigate])

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError(null)
    setSignupSent(false)
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) console.error('Google 로그인 실패:', error)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      setSubmitting(false)
      if (error) {
        setError(
          error.message.includes('already registered')
            ? '이미 가입된 이메일이에요. 로그인해주세요.'
            : '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.'
        )
        return
      }
      if (!data.session) {
        setSignupSent(true)
      }
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">
        {mode === 'login' ? '로그인' : '회원가입'}
      </h1>
      <p className="mt-2 text-sm text-cream-subtext dark:text-night-text/70">
        로그인하면 하루 3회 코디 추천과 저장 기능을 이용할 수 있어요.
      </p>

      <div className="mt-6 flex w-full rounded-full border border-cream-border p-1 dark:border-night-border">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            mode === 'login'
              ? 'bg-accent-green text-white'
              : 'text-cream-subtext dark:text-night-text/60'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-accent-green text-white'
              : 'text-cream-subtext dark:text-night-text/60'
          }`}
        >
          회원가입
        </button>
      </div>

      {signupSent ? (
        <p className="mt-8 text-sm text-cream-text dark:text-night-text">
          <strong>{email}</strong>로 가입 확인 메일을 보냈어요. 메일함(스팸함 포함)에서 링크를 눌러 가입을 완료해주세요.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 w-full text-left">
          <label className="block text-xs font-medium text-cream-subtext dark:text-night-text/70">이메일</label>
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

          <label className="mt-3 block text-xs font-medium text-cream-subtext dark:text-night-text/70">비밀번호</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-cream-border bg-cream-bg px-3 py-2 dark:border-night-border dark:bg-night-bg">
            <Lock size={16} className="shrink-0 text-cream-subtext dark:text-night-text/50" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm text-cream-text outline-none dark:text-night-text"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </form>
      )}

      <div className="mt-6 flex w-full items-center gap-3 text-xs text-cream-subtext dark:text-night-text/50">
        <span className="h-px flex-1 bg-cream-border dark:bg-night-border" />
        또는
        <span className="h-px flex-1 bg-cream-border dark:bg-night-border" />
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        className="mt-6 w-full rounded-full border border-cream-border bg-white px-6 py-3 text-sm font-semibold text-cream-text transition-opacity hover:opacity-90 dark:border-night-border dark:bg-night-card dark:text-night-text"
      >
        Google로 시작하기
      </button>
    </div>
  )
}
