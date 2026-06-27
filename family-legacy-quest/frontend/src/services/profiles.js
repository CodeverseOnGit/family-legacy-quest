import { supabase } from './supabase'

export const profilesService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${userId}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId)

    return data.publicUrl
  },

  async addPoints(userId, points) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    const newPoints = (profile?.points || 0) + points

    const { data, error } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error

    await profilesService.checkAndAwardBadges(userId)
    return data
  },

  async checkAndAwardBadges(userId) {
    const { data: storyCount } = await supabase
      .from('stories')
      .select('id', { count: 'exact' })
      .eq('author_id', userId)

    const count = storyCount?.length || 0
    const badgesToCheck = [
      { name: 'Storyteller', minStories: 10 },
      { name: 'Historian', minStories: 25 },
      { name: 'Legacy Keeper', minStories: 50 },
      { name: 'Memory Master', minStories: 100 },
    ]

    for (const badge of badgesToCheck) {
      if (count >= badge.minStories) {
        const { data: badgeData } = await supabase
          .from('badges')
          .select('id')
          .eq('name', badge.name)
          .single()

        if (badgeData) {
          await supabase
            .from('user_badges')
            .upsert({ user_id: userId, badge_id: badgeData.id }, { ignoreDuplicates: true })
        }
      }
    }
  },

  async getUserBadges(userId) {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },
}
