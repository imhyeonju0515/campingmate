import { NavLink, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Button, Container, Form, Nav, Navbar, Toast, ToastContainer } from 'react-bootstrap'
import { NAV_ITEMS } from '../router'
import { LANGS, useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'

const ICONS = { home: 'house', camps: 'tree', stories: 'book', map: 'globe-asia-australia', agent: 'robot', passport: 'journal-bookmark' }

export default function RootLayout() {
  const t = useT()
  const toasts = useAppStore((s) => s.toasts)
  const lang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const user = useAppStore((s) => s.user)
  const nickname = useAppStore((s) => s.nickname)
  const setUser = useAppStore((s) => s.setUser)

  // 새로고침해도 로그인이 유지되도록 세션을 복원하고, 로그인·로그아웃 변화를 따라갑니다
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [setUser])

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="dark" data-bs-theme="dark" sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/" className="fw-bold">⛺ <span className="d-none d-sm-inline">{t('brand')}</span></Navbar.Brand>
          {/* 데스크톱 메뉴 */}
          <Nav className="me-auto d-none d-md-flex flex-row gap-1">
            {NAV_ITEMS.map(({ to, key }) => (
              <Nav.Link key={to} as={NavLink} to={to} end={to === '/'} className="px-3">
                <i className={`bi bi-${ICONS[key]} me-1`} />{t(key)}
              </Nav.Link>
            ))}
          </Nav>
          <Button as={NavLink} to="/login" size="sm" variant="light" className="ms-auto me-2">
            <i className="bi bi-person-circle me-1" />{user ? (nickname || user.email.split('@')[0]) : t('login')}
          </Button>
          <Form.Select size="sm" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="language" style={{ width: 'auto' }}>
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Form.Select>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-4">
        <Container><Outlet /></Container>   {/* ← 여기에 주소에 맞는 페이지가 들어갑니다 */}
      </main>

      <footer className="py-3 border-top bg-light d-none d-md-block">
        <Container className="small text-muted">데이터: 한국관광공사(고캠핑·TourAPI) · 기상청 · 에어코리아 · 한국천문연구원 · 국가유산청</Container>
      </footer>

      {/* 모바일 하단 탭바 */}
      <Nav className="bottom-tabs d-md-none justify-content-around">
        {NAV_ITEMS.map(({ to, key }) => (
          <Nav.Link key={to} as={NavLink} to={to} end={to === '/'} className="text-center">
            <i className={`bi bi-${ICONS[key]} d-block fs-5`} />{t(key)}
          </Nav.Link>
        ))}
      </Nav>

      {/* 스토어의 toast() 로 띄운 알림 */}
      <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 2000 }}>
        {toasts.map((x) => (
          <Toast key={x.id} bg={x.variant}><Toast.Body className="text-white">{x.message}</Toast.Body></Toast>
        ))}
      </ToastContainer>
    </div>
  )
}
