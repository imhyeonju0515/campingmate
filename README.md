# 하르방 campmate (Vite + React + Router + Zustand + Bootstrap/Bootswatch(brite) + Supabase)

돌하르방 캐릭터가 오늘의 **바람**을 읽어 제주 캠핑장을 추천하고, 캠핑장 근처 **오름·신화 이야기**에서 도장을 모으는 서비스.
한국어·English·中文·日本語 지원, AI 하르방(에이전트)이 공공데이터를 도구로 써서 캠핑장을 추천합니다.

## 실행
```bash
npm install
cp .env.example .env.local     # 값 채우기
npm run dev:api                # 화면 + /api 서버 함수 (http://localhost:5173) ← 로컬에서는 이걸 쓰세요 (.env.local 을 읽음)
npm run dev                    # 화면만 — /api 가 없어 캠핑장·날씨·AI 가 동작하지 않음
vercel dev                     # (선택) Vercel CLI 가 있을 때 화면 + /api (http://localhost:3000)
```

## 공공데이터 API (data.go.kr 에서 활용 신청, 같은 Decoding 키 사용)
| API | 쓰는 곳 |
|---|---|
| 한국관광공사 고캠핑 (`GoCamping/basedList`) | 제주 캠핑장 목록 (키 없으면 가상 샘플) |
| 한국관광공사 국문·영문·중문·일문 관광정보 (`Kor/Eng/Chs/JpnService2`) | 캠핑장 주변 장소(언어별) |
| 기상청 단기예보 | 풍속·풍향·강수 → 캠핑 컨디션 |
| 에어코리아 대기오염정보 | 미세먼지 |
| 한국천문연구원 출몰시각 정보 (`RiseSetInfoService`) | 일몰 시간 |
| 국가유산청 국가유산 검색 (키 불필요) | 이야기 카드의 국가유산 표시 |

※ API 응답 필드는 신청 후 실제 응답으로 한 번 확인하세요 (`server/camps.js`, `server/sun.js`, `server/air.js`).
※ 샘플 캠핑장은 실제 업체가 아닌 가상 예시입니다. 오름·신화 스팟(`server/data/stories.js`)의 좌표는 대략값입니다.
※ 바람 등급(`server/wind.js`)은 경험칙이며 공식 안전 기준이 아닙니다.

## AI 에이전트 도구 (`api/agent.js`)
`list_camps` · `get_camp_detail` · `list_oreum_stories` · `get_camp_condition` · `search_heritage`

## Supabase (선택) — 도장은 기본적으로 localStorage 에 저장되고, 설정하면 DB 에도 기록
`supabase/schema.sql` 을 Supabase 대시보드 → SQL Editor 에 붙여 넣고 Run 하세요. (stamps 테이블 + 읽기·추가만 허용하는 RLS 정책)

## 구조
```
api/        Vercel 서버 함수 (/api/파일이름) — 비밀 키는 여기서만
server/     공공데이터 호출 함수 (api/ 와 에이전트가 함께 사용), wind.js 바람 규칙, data/ 샘플·스토리
src/
  main.jsx          Bootstrap·Bootswatch 테마 로드 + 라우터 시작
  router.jsx        메뉴(NAV_ITEMS) + 주소별 페이지
  i18n.js           4개 언어 문구 사전 + useT()
  layouts/          공통 틀 (상단바·모바일 하단탭·알림)
  store/            Zustand 전역 상태 (닉네임·언어·도장·대화)
  lib/              supabase.js, useConditions.js(두 지역 컨디션)
  api/client.js     화면 → /api 호출 함수
  components/       Harubang, StampMark, CampCard, StoryCard, ConditionCard, PageHeader, Status
  pages/            Home · Camps · CampDetail · Stories · Agent · Passport
```
