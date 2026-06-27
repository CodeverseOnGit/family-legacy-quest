import { create } from 'zustand'
import { supabase } from '../services/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  family: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setFamily: (family) => set({ family }),

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const { data: familyMember } = await supabase
        .from('family_members')
        .select('families(*)')
        .eq('user_id', session.user.id)
        .single()

      set({
        user: session.user,
        session,
        profile: profile || null,
        family: familyMember?.families || null,
        loading: false,
      })
    } else {
      set({ loading: false })
    }
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    set({ profile: data })
  },

  refreshFamily: async () => {
    const { user } = get()
    if (!user) return
    const { data } = await supabase
      .from('family_members')
      .select('families(*)')
      .eq('user_id', user.id)
      .single()
    set({ family: data?.families || null })
  },

  logout: () => set({ user: null, profile: null, session: null, family: null }),
}))

export default useAuthStore
