import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// ── 디자인 ───────────────────────────────────────────────
// Bootstrap 5 + Bootswatch 테마. 아래 'united' 한 단어만 바꾸면 앱 전체 디자인이 바뀝니다.
// 추천: united(주황) · sandstone(흙색) · lux(고급) · flatly(깔끔) · journal · minty · sketchy
// 테마 미리보기: https://bootswatch.com
import 'bootswatch/dist/united/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'

import { router } from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
