import { NavLink, Outlet } from 'react-router-dom'
import { Container, Form, Nav, Navbar, Toast, ToastContainer } from 'react-bootstrap'
import { NAV_ITEMS } from '../router'
import { LANGS, useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const ICONS = { home: 'house', camps: 'tree', stories: 'book', map: 'globe-asia-australia', agent: 'robot', passport: 'journal-bookmark' }

export default function RootLayout() {
  const t = useT()
  const toasts = useAppStore((s) => s.toasts)
  const lang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)

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
          <Form.Select size="sm" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="language" className="ms-auto" style={{ width: 'auto' }}>
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
