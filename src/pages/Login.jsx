import { useState } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useT } from '../i18n'
import { isSupabaseReady } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

// 이메일 로그인 · 회원가입 · 닉네임 설정 (Supabase Auth)
export default function Login() {
  const t = useT()
  const navigate = useNavigate()
  const { user, nickname, signIn, signUp, signOut, saveNickname, toast } = useAppStore()
  const [mode, setMode] = useState('login')          // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nick, setNick] = useState(nickname)
  const [busy, setBusy] = useState(false)
  const [mailSent, setMailSent] = useState(false)

  if (!isSupabaseReady) {
    return <><PageHeader icon="person-circle" title={t('login')} /><Alert variant="warning">{t('noAuth')}</Alert></>
  }

  const run = async (fn, okMsg) => {
    setBusy(true)
    try { await fn(); if (okMsg) toast(okMsg) } catch (e) { toast(e.message, 'danger') } finally { setBusy(false) }
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'login') {
      run(async () => { await signIn(email, password); navigate('/passport') }, t('loginDone'))
    } else {
      run(async () => {
        const needsConfirm = await signUp(email, password, nick)
        if (needsConfirm) setMailSent(true)
        else navigate('/passport')
      })
    }
  }

  // 로그인된 상태: 계정 정보 + 닉네임 설정
  if (user) {
    return (
      <>
        <PageHeader icon="person-circle" title={t('loggedInAs')} />
        <Card style={{ maxWidth: 420 }}>
          <Card.Body>
            <div className="mb-3"><i className="bi bi-envelope me-2 text-primary" />{user.email}</div>
            <Form onSubmit={(e) => { e.preventDefault(); run(() => saveNickname(nick), t('nickSaved')) }}>
              <Form.Label className="fw-bold">{t('nicknameSet')}</Form.Label>
              <div className="d-flex gap-2 mb-3">
                <Form.Control value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} placeholder={t('nickname')} />
                <Button type="submit" variant="primary" disabled={busy || !nick.trim()}>{t('saveNick')}</Button>
              </div>
            </Form>
            <Button variant="outline-dark" size="sm" onClick={() => signOut()}><i className="bi bi-box-arrow-right me-1" />{t('logout')}</Button>
          </Card.Body>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader icon="person-circle" title={mode === 'login' ? t('login') : t('signup')} subtitle={t('loginIntro')} />
      <Card style={{ maxWidth: 420 }}>
        <Card.Body>
          {mailSent && <Alert variant="success">{t('checkMail')}</Alert>}
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t('email')}</Form.Label>
              <Form.Control type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t('password')}</Form.Label>
              <Form.Control type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Group>
            {mode === 'signup' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">{t('nickname')}</Form.Label>
                <Form.Control value={nick} maxLength={20} onChange={(e) => setNick(e.target.value)} />
              </Form.Group>
            )}
            <Button type="submit" variant="primary" className="w-100 mb-2" disabled={busy}>{mode === 'login' ? t('login') : t('signup')}</Button>
          </Form>
          <Button variant="link" size="sm" className="p-0" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMailSent(false) }}>
            {mode === 'login' ? t('toSignup') : t('toLogin')}
          </Button>
        </Card.Body>
      </Card>
    </>
  )
}
