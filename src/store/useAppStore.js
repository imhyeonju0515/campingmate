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

      // ③ 도장 시스템 — 단일/다중 패스포트 지원
      stamps: [],                      // { spotId, name, tag, campId, at } — 호환성 유지
      passports: [],                   // [{ id, createdAt, stamps[], coverColor, nickname }]
      currentPassportId: null,         // 현재 활성 패스포트 ID

      // 현재 활성 패스포트 꺼내기
      getCurrentPassport: () => {
        const { passports, currentPassportId } = get()
        return passports.find((p) => p.id === currentPassportId) || null
      },

      // 현재 도장 목록 얻기
      getCurrentStamps: () => {
        const cp = get().getCurrentPassport()
        return cp?.stamps || get().stamps
      },

      hasStamp: (spotId) => {
        return get().getCurrentStamps().some((s) => s.spotId === spotId)
      },

      stampSpot: async ({ spotId, name, tag, campId }) => {
        if (get().hasStamp(spotId)) return
        const cp = get().getCurrentPassport()
        const newStamp = { spotId, name, tag, campId: campId ?? null, at: new Date().toISOString() }

        if (cp) {
          // 패스포트 안에 도장 추가
          const newStamps = [...cp.stamps, newStamp]
          set({
            passports: get().passports.map((p) => p.id === cp.id ? { ...p, stamps: newStamps } : p),
          })
          // 7개 이상이면 새 패스포트 자동 생성
          if (newStamps.length >= 7) {
            get().createNewPassport()
            get().toast('도장 쾅! 🎉 패스포트가 가득 찼어요! 새 패스포트를 만들 수 있어요', 'success')
          }
        } else {
          // 패스포트 없으면 스탬프 배열에 추가 (호환성)
          set({ stamps: [...get().stamps, newStamp] })
        }
        if (supabase) {
          const { error } = await supabase.from('stamps').insert({
            nickname: get().nickname || '익명', spot_id: spotId, spot_name: name, camp_id: campId ?? null,
          })
          if (error) get().toast(error.message, 'warning')
        }
      },

      // 새 패스포트 생성
      createNewPassport: () => {
        const newPassport = {
          id: `pp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          stamps: [],
          coverColor: get().coverColor,
          nickname: get().nickname,
        }
        set({
          passports: [...get().passports, newPassport],
          currentPassportId: newPassport.id,
        })
      },

      // 패스포트 전환
      switchPassport: (passportId) => set({ currentPassportId: passportId }),

      // 초기화: 현재 패스포트/도장만 초기화
      resetStamps: () => {
        const cp = get().getCurrentPassport()
        if (cp) {
          set({
            passports: get().passports.map((p) => p.id === cp.id ? { ...p, stamps: [] } : p),
          })
        } else {
          set({ stamps: [] })
        }
      },

      // 패스포트 삭제
      deletePassport: (passportId) => {
        set({ passports: get().passports.filter((p) => p.id !== passportId) })
        if (get().currentPassportId === passportId) {
          const remaining = get().passports
          set({ currentPassportId: remaining.length > 0 ? remaining[0].id : null })
        }
      },

      // ④ 에이전트 대화 — 페이지를 옮겨도 대화가 남도록 store 에 둡니다
      messages: [],          // { role: 'user' | 'assistant', text, camps, steps }
      chatLoading: false,
      sendMessage: async (text) => {
        // Claude 형식. 추천 캠핑장 이름도 붙여야 "그중 첫 번째는?" 같은 후속 질문을 이해합니다
        const history = get().messages.map((m) => ({ role: m.role, content: m.camps?.length ? `${m.text}\n(추천: ${m.camps.map((c) => c.name).join(', ')})` : m.plan?.days?.length ? `${m.text}\n(일정: ${m.plan.title || '1박 2일'})` : m.text }))
        set({ messages: [...get().messages, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, camps, plan, steps } = await askAgent(text, history, get().lang)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, camps: camps ?? [], plan: plan ?? null, steps }] })
        } catch (e) {
          get().toast(e.message, 'danger')
        } finally {
          set({ chatLoading: false })
        }
      },
    }),
    {
      name: 'harubang-windcamp-store',                                // localStorage 키 이름
      partialize: (s) => ({ nickname: s.nickname, lang: s.lang, stamps: s.stamps, favorites: s.favorites, coverColor: s.coverColor, passports: s.passports, currentPassportId: s.currentPassportId }),
    },
  ),
)
