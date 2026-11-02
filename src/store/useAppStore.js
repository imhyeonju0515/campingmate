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
      lang: 'ko',                      // 'ko' | 'en' | 'zh' | 'ja'
      setLang: (lang) => set({ lang }),

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
      partialize: (s) => ({ nickname: s.nickname, lang: s.lang, stamps: s.stamps }),
    },
  ),
)
