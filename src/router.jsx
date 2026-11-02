import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import Camps from './pages/Camps'
import CampDetail from './pages/CampDetail'
import Stories from './pages/Stories'
import MapPage from './pages/Map'
import Agent from './pages/Agent'
import Passport from './pages/Passport'
import NotFound from './pages/NotFound'

// ── 메뉴 목록 ────────────────────────────────────────────
// 페이지를 추가할 때: ① pages/에 파일 만들기 ② 아래 NAV_ITEMS 에 한 줄 추가 ③ routes 에 한 줄 추가
// key 는 i18n.js 문구 키이자 RootLayout 의 아이콘 키입니다.
export const NAV_ITEMS = [
  { to: '/', key: 'home' },
  { to: '/camps', key: 'camps' },
  { to: '/stories', key: 'stories' },
  { to: '/map', key: 'map' },
  { to: '/agent', key: 'agent' },
  { to: '/passport', key: 'passport' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,      // 모든 페이지에 공통으로 보이는 틀(상단바·하단탭)
    errorElement: <NotFound />,   // 없는 주소로 들어오면
    children: [
      { index: true, element: <Home /> },
      { path: 'camps', element: <Camps /> },
      { path: 'camps/:id', element: <CampDetail /> },
      { path: 'stories', element: <Stories /> },
      { path: 'map', element: <MapPage /> },
      { path: 'agent', element: <Agent /> },
      { path: 'passport', element: <Passport /> },
    ],
  },
])
