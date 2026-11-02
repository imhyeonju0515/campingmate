-- 하르방 campmate — Supabase 테이블
-- 사용법: Supabase 대시보드 → SQL Editor → New query → 이 파일 내용을 붙여 넣고 Run
-- 도장(stamps) 기록용입니다. 앱은 도장을 브라우저(localStorage)에도 저장하므로, 이 테이블이 없어도 동작은 합니다.

create table if not exists public.stamps (
  id         bigint generated always as identity primary key,
  nickname   text        not null,          -- 사용자 닉네임 (없으면 '익명')
  spot_id    text,                          -- 이야기 스팟 id (예: s-samseonghyeol)
  spot_name  text,                          -- 이야기 스팟 이름
  camp_id    text,                          -- 도장을 찍은 캠핑장 id (스토리 목록에서 찍으면 null)
  created_at timestamptz not null default now()
);

create index if not exists stamps_nickname_idx on public.stamps (nickname, created_at desc);

-- Row Level Security: 로그인이 없는 앱이라 anon·로그인 사용자 모두 "읽기·추가"만 허용하고, 수정·삭제는 막습니다.
alter table public.stamps enable row level security;

drop policy if exists "stamps_select" on public.stamps;
drop policy if exists "stamps_insert" on public.stamps;

create policy "stamps_select" on public.stamps for select to anon, authenticated using (true);
create policy "stamps_insert" on public.stamps for insert to anon, authenticated with check (true);

-- ※ 닉네임으로만 구분하므로 누구나 모든 기록을 읽을 수 있습니다. 개인정보(실명 등)는 닉네임에 넣지 마세요.
--   사용자별로 안전하게 나누려면 Supabase Auth 로그인을 붙이고 user_id 컬럼 + 정책을 추가해야 합니다.


-- ───────── 즐겨찾기 (로그인한 사용자만, 내 것만 읽고·추가하고·삭제) ─────────
create table if not exists public.favorites (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  camp_id    text        not null,                 -- 고캠핑 contentId
  created_at timestamptz not null default now(),
  primary key (user_id, camp_id)
);

alter table public.favorites enable row level security;

drop policy if exists "fav_select" on public.favorites;
drop policy if exists "fav_insert" on public.favorites;
drop policy if exists "fav_update" on public.favorites;
drop policy if exists "fav_delete" on public.favorites;

create policy "fav_select" on public.favorites for select to authenticated using (user_id = auth.uid());
create policy "fav_insert" on public.favorites for insert to authenticated with check (user_id = auth.uid());
create policy "fav_update" on public.favorites for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "fav_delete" on public.favorites for delete to authenticated using (user_id = auth.uid());
