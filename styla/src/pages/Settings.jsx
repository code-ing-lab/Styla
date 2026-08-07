import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const PROVIDER_LABEL = {
  email: '이메일',
  google: 'Google',
  kakao: '카카오',
}

export default function Settings() {
  const navigate = useNavigate()
  const { isLoggedIn, user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) navigate('/login')
  }, [authLoading, isLoggedIn, navigate])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  if (authLoading || !user) {
    return <p className="py-24 text-center text-sm text-cream-subtext dark:text-night-text/60">불러오는 중...</p>
  }

  const provider = user.app_metadata?.provider ?? 'email'
  const providerLabel = PROVIDER_LABEL[provider] ?? provider
  const joinedAt = new Date(user.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 해요.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않아요.')
      return
    }

    setPasswordSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSubmitting(false)

    if (error) {
      setPasswordError('비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setPasswordMessage('비밀번호가 변경되었습니다.')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError(null)

    const { error } = await supabase.functions.invoke('delete-account')

    if (error) {
      setDeleting(false)
      setDeleteError('회원탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">설정</h1>

      <section className="mt-6 rounded-3xl border border-cream-border bg-cream-card p-6 dark:border-night-border dark:bg-night-card">
        <h2 className="font-serif text-lg font-semibold text-cream-text dark:text-night-text">계정 정보</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-cream-subtext dark:text-night-text/60">이메일</dt>
            <dd className="text-cream-text dark:text-night-text">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream-subtext dark:text-night-text/60">가입 방법</dt>
            <dd className="text-cream-text dark:text-night-text">{providerLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream-subtext dark:text-night-text/60">가입일</dt>
            <dd className="text-cream-text dark:text-night-text">{joinedAt}</dd>
          </div>
        </dl>
      </section>

      {provider === 'email' && (
        <section className="mt-6 rounded-3xl border border-cream-border bg-cream-card p-6 dark:border-night-border dark:bg-night-card">
          <h2 className="font-serif text-lg font-semibold text-cream-text dark:text-night-text">비밀번호 변경</h2>
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              required
              minLength={6}
              placeholder="새 비밀번호 (6자 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-cream-border bg-cream-bg px-3 py-2 text-sm text-cream-text outline-none focus:border-accent-green dark:border-night-border dark:bg-night-bg dark:text-night-text"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-cream-border bg-cream-bg px-3 py-2 text-sm text-cream-text outline-none focus:border-accent-green dark:border-night-border dark:bg-night-bg dark:text-night-text"
            />
            <button
              type="submit"
              disabled={passwordSubmitting}
              className="w-full rounded-full bg-accent-green px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {passwordSubmitting ? '변경 중...' : '비밀번호 변경'}
            </button>
            {passwordMessage && <p className="text-xs text-accent-green">{passwordMessage}</p>}
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          </form>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-red-200 bg-cream-card p-6 dark:border-red-900/40 dark:bg-night-card">
        <h2 className="font-serif text-lg font-semibold text-red-500">회원탈퇴</h2>
        <p className="mt-2 text-sm text-cream-subtext dark:text-night-text/70">
          탈퇴하면 저장한 코디, 이용 기록 등 모든 데이터가 즉시 삭제되며 복구할 수 없어요.
        </p>

        {!deleteConfirming ? (
          <button
            type="button"
            onClick={() => setDeleteConfirming(true)}
            className="mt-4 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20"
          >
            회원탈퇴
          </button>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-red-500">정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? '처리 중...' : '네, 탈퇴할게요'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirming(false)}
                disabled={deleting}
                className="rounded-full border border-cream-border px-4 py-2 text-sm text-cream-text dark:border-night-border dark:text-night-text"
              >
                취소
              </button>
            </div>
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
          </div>
        )}
      </section>
    </div>
  )
}
