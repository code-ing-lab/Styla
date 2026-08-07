import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

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
    </div>
  )
}
