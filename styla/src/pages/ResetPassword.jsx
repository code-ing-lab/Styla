import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

// 이메일의 "비밀번호 재설정" 링크를 클릭하면 이 페이지로 돌아온다.
// 링크의 토큰으로 임시 세션이 만들어지므로, 로그인 없이도 새 비밀번호를 설정할 수 있다.
export default function ResetPassword() {
  const navigate = useNavigate()
  const { isLoggedIn, loading: authLoading } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않아요.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSubmitting(false)

    if (error) {
      setError('비밀번호 변경에 실패했습니다. 링크가 만료되었을 수 있어요. 다시 시도해주세요.')
      return
    }
    setDone(true)
    setTimeout(() => navigate('/'), 1500)
  }

  if (authLoading) {
    return <p className="py-24 text-center text-sm text-cream-subtext dark:text-night-text/60">불러오는 중...</p>
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-sm px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">링크가 유효하지 않아요</h1>
        <p className="mt-2 text-sm text-cream-subtext dark:text-night-text/70">
          비밀번호 재설정 메일의 링크를 다시 눌러 들어와주세요. 링크는 일정 시간이 지나면 만료돼요.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">새 비밀번호 설정</h1>

      {done ? (
        <p className="mt-8 text-sm text-cream-text dark:text-night-text">
          비밀번호가 변경되었어요. 잠시 후 홈으로 이동합니다.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 w-full text-left">
          <label className="block text-xs font-medium text-cream-subtext dark:text-night-text/70">새 비밀번호</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-cream-border bg-cream-bg px-3 py-2 dark:border-night-border dark:bg-night-bg">
            <Lock size={16} className="shrink-0 text-cream-subtext dark:text-night-text/50" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="6자 이상"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-transparent text-sm text-cream-text outline-none dark:text-night-text"
            />
          </div>

          <label className="mt-3 block text-xs font-medium text-cream-subtext dark:text-night-text/70">새 비밀번호 확인</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-cream-border bg-cream-bg px-3 py-2 dark:border-night-border dark:bg-night-bg">
            <Lock size={16} className="shrink-0 text-cream-subtext dark:text-night-text/50" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="6자 이상"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent text-sm text-cream-text outline-none dark:text-night-text"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? '변경 중...' : '비밀번호 변경'}
          </button>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </form>
      )}
    </div>
  )
}
