import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { askAgent } from '../api/client'

// ── 앱 전체가 함께 쓰는 상태(store) ──────────────────────
// 여러 페이지에서 같이 쓰는 데이터는 여기에 둡니다. (한 페이지에서만 쓰면 useState)
// 사용법:  const lang = useAppStore((s) => s.lang)
export const useAppStore = create(
  persist(
    (set, get) => ({
      // ① 사용자·언어 — localStorage 에 저장되어 새로고침해도 유지
      nickname: '',
      setNickname: (nickname) => set({ nickname: nickname.trim() }),
      coverColor: 'kraft',             // 패스포트 표지 색 'kraft' | 'wine' | 'forest' | 'navy'
      setCoverColor: (coverColor) => set({ coverColor }),
      lang: 'ko',                      // 'ko' | 'en' | 'zh' | 'ja'
      setLang: (lang) => set({ lang }),

      // 로그인 사용자 (Supabase Auth) — 저장하지 않고 앱 시작 때 세션에서 복원 (RootLayout 에서)
      user: null,
      setUser: (user) => set({ user, ...(user?.user_metadata?.nickname ? { nickname: user.user_metadata.nickname } : {}) }),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      // 이메일 확인을 켜 둔 프로젝트는 session 이 null → true 를 돌려 "메일 확인" 안내를 띄웁니다
      signUp: async (email, password, nick) => {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nickname: nick.trim() } } })
        if (error) throw error
        return !data.session
      },
      signOut: async () => { await supabase.auth.signOut(); set({ user: null }) },
      saveNickname: async (nick) => {
        const nickname = nick.trim()
        const { data, error } = await supabase.auth.updateUser({ data: { nickname } })
        if (error) throw error
        set({ nickname, user: data.user })
      },

      // 즐겨찾기 — 캠핑장 id 목록. localStorage 에 저장하고, 로그인 중이면 Supabase favorites 테이블과 맞춥니다
      favorites: [],
      isFav: (id) => get().favorites.includes(id),
      toggleFav: async (id) => {
        const on = !get().favorites.includes(id)
        set({ favorites: on ? [...get().favorites, id] : get().favorites.filter((x) => x !== id) })
        const user = get().user
        if (!supabase || !user) return
        const { error } = on
          ? await supabase.from('favorites').upsert({ user_id: user.id, camp_id: id })
          : await supabase.from('favorites').delete().eq('user_id', user.id).eq('camp_id', id)
        if (error) get().toast(error.message, 'warning')
      },
      // 로그인 직후: 내 계정의 즐겨찾기와 이 기기의 즐겨찾기를 합칩니다
      syncFavorites: async () => {
        const user = get().user
        if (!supabase || !user) return
        const { data, error } = await supabase.from('favorites').select('camp_id')
        if (error) return get().toast(error.message, 'warning')
        const remote = data.map((r) => r.camp_id)
        const local = get().favorites
        set({ favorites: [...new Set([...remote, ...local])] })
        const missing = local.filter((id) => !remote.includes(id))
        if (missing.length) await supabase.from('favorites').upsert(missing.map((camp_id) => ({ user_id: user.id, camp_id })))
      },

      // ② 알림(토스트) — 어느 페이지에서든 get().toast('메시지')
      toasts: [],
      toast: (message, variant = 'success') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, variant }] })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2500)
      },

      // ③ 이야기 도장 — localStorage 에 저장하고, Supabase 가 설정돼 있으면 stamps 테이블에도 기록
      stamps: [],                      // { spotId, name, tag, campId, at }
      hasStamp: (spotId) => get().stamps.some((s) => s.spotId === spotId),
      stampSpot: async ({ spotId, name, tag, campId }) => {
        if (get().hasStamp(spotId)) return
        set({ stamps: [...get().stamps, { spotId, name, tag, campId: campId ?? null, at: new Date().toISOString() }] })
        if (supabase) {
          const { error } = await supabase.from('stamps').insert({
            nickname: get().nickname || '익명', spot_id: spotId, spot_name: name, camp_id: campId ?? null,
          })
          if (error) get().toast(error.message, 'warning')
        }
      },
      resetStamps: () => set({ stamps: [] }),

      // ④ 에이전트 대화 — 페이지를 옮겨도 대화가 남도록 store 에 둡니다
      messages: [],          // { role: 'user' | 'assistant', text, steps }
      chatLoading: false,
      sendMessage: async (text) => {
        const history = get().messages.map((m) => ({ role: m.role, content: m.text }))  // Claude 형식
        set({ messages: [...get().messages, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, steps } = await askAgent(text, history, get().lang)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, steps }] })
        } catch (e) {
          get().toast(e.message, 'danger')
        } finally {
          set({ chatLoading: false })
        }
      },
    }),
    {
      name: 'harubang-windcamp-store',                                // localStorage 키 이름
      partialize: (s) => ({ nickname: s.nickname, lang: s.lang, stamps: s.stamps, favorites: s.favorites, coverColor: s.coverColor }),
    },
  ),
)
