import { supabase } from './supabase'

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const familiesService = {
  async createFamily(name, userId) {
    let inviteCode = generateInviteCode()
    let attempts = 0

    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCode)
        .single()

      if (!existing) break
      inviteCode = generateInviteCode()
      attempts++
    }

    const { data: family, error } = await supabase
      .from('families')
      .insert({ name, invite_code: inviteCode, created_by: userId })
      .select()
      .single()
    if (error) throw error

    const { error: memberError } = await supabase
      .from('family_members')
      .insert({ family_id: family.id, user_id: userId })
    if (memberError) throw memberError

    return family
  },

  async joinFamily(inviteCode, userId) {
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (familyError || !family) throw new Error('Family not found. Check your invite code.')

    const { data: existing } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', family.id)
      .eq('user_id', userId)
      .single()

    if (existing) throw new Error('You are already a member of this family.')

    const { error: joinError } = await supabase
      .from('family_members')
      .insert({ family_id: family.id, user_id: userId })
    if (joinError) throw joinError

    return family
  },

  async getUserFamily(userId) {
    const { data, error } = await supabase
      .from('family_members')
      .select('families(*)')
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data?.families || null
  },

  async getFamilyMembers(familyId) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, profiles(*)')
      .eq('family_id', familyId)
    if (error) throw error
    return data
  },

  async getFamilyStats(familyId) {
    const [storiesRes, membersRes, questsRes] = await Promise.all([
      supabase.from('stories').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('family_members').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase
        .from('quest_completions')
        .select('id', { count: 'exact' })
        .in(
          'user_id',
          (
            await supabase.from('family_members').select('user_id').eq('family_id', familyId)
          ).data?.map((m) => m.user_id) || []
        ),
    ])

    return {
      stories: storiesRes.data?.length || 0,
      members: membersRes.data?.length || 0,
      quests: questsRes.data?.length || 0,
    }
  },
}
