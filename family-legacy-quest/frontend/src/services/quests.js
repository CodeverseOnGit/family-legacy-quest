import { supabase } from './supabase'
import { profilesService } from './profiles'
import { notificationsService } from './notifications'

export const questsService = {
  async getActiveQuests() {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getUserCompletions(userId) {
    const { data, error } = await supabase
      .from('quest_completions')
      .select('*, quests(*)')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },

  async completeQuest(questId, userId) {
    const { data: existing } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('quest_id', questId)
      .eq('user_id', userId)
      .single()

    if (existing) throw new Error('Quest already completed')

    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single()

    const { data, error } = await supabase
      .from('quest_completions')
      .insert({ quest_id: questId, user_id: userId })
      .select()
      .single()
    if (error) throw error

    if (quest) {
      await profilesService.addPoints(userId, quest.reward_points)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      const { data: familyMember } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .single()

      if (familyMember) {
        const { data: members } = await supabase
          .from('family_members')
          .select('user_id')
          .eq('family_id', familyMember.family_id)
          .neq('user_id', userId)

        if (members) {
          for (const member of members) {
            await notificationsService.create(
              member.user_id,
              `${profile?.full_name || 'Someone'} completed the quest: "${quest.title}"`
            )
          }
        }
      }
    }

    return data
  },
}
