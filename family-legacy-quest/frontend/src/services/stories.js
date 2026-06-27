import { supabase } from './supabase'
import { profilesService } from './profiles'
import { notificationsService } from './notifications'

export const storiesService = {
  async createStory({ familyId, authorId, title, prompt, content, tags = [] }) {
    const { data: story, error } = await supabase
      .from('stories')
      .insert({ family_id: familyId, author_id: authorId, title, prompt, content })
      .select()
      .single()
    if (error) throw error

    if (tags.length > 0) {
      const tagInserts = tags.map((tag) => ({ story_id: story.id, tag }))
      await supabase.from('story_tags').insert(tagInserts)
    }

    await profilesService.addPoints(authorId, 20)

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authorId)
      .single()

    const { data: members } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', familyId)
      .neq('user_id', authorId)

    if (members) {
      for (const member of members) {
        await notificationsService.create(
          member.user_id,
          `${profile?.full_name || 'Someone'} shared a new story: "${title}"`
        )
      }
    }

    return story
  },

  async uploadCoverImage(storyId, file) {
    const fileExt = file.name.split('.').pop()
    const filePath = `stories/${storyId}.${fileExt}`
    const { error } = await supabase.storage
      .from('story-images')
      .upload(filePath, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('story-images').getPublicUrl(filePath)
    await supabase.from('stories').update({ cover_image: data.publicUrl }).eq('id', storyId)
    return data.publicUrl
  },

  async getFamilyStories(familyId, { page = 0, limit = 10, search = '' } = {}) {
    let query = supabase
      .from('stories')
      .select('*, profiles!stories_author_id_fkey(*), story_tags(*), reactions(*), comments(count)')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .range(page * limit, page * limit + limit - 1)

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getStory(storyId) {
    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles!stories_author_id_fkey(*), story_tags(*), reactions(*, profiles(*)), comments(*, profiles!comments_author_id_fkey(*))')
      .eq('id', storyId)
      .single()
    if (error) throw error
    return data
  },

  async updateStory(storyId, updates, tags) {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', storyId)
      .select()
      .single()
    if (error) throw error

    if (tags !== undefined) {
      await supabase.from('story_tags').delete().eq('story_id', storyId)
      if (tags.length > 0) {
        await supabase.from('story_tags').insert(tags.map((tag) => ({ story_id: storyId, tag })))
      }
    }

    return data
  },

  async deleteStory(storyId) {
    const { error } = await supabase.from('stories').delete().eq('id', storyId)
    if (error) throw error
  },

  async addReaction(storyId, userId, emoji) {
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single()

    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
      return null
    }

    const { data, error } = await supabase
      .from('reactions')
      .insert({ story_id: storyId, user_id: userId, emoji })
      .select()
      .single()
    if (error) throw error

    await profilesService.addPoints(userId, 1)
    return data
  },

  async addComment(storyId, authorId, content, familyId) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ story_id: storyId, author_id: authorId, content })
      .select('*, profiles!comments_author_id_fkey(*)')
      .single()
    if (error) throw error

    await profilesService.addPoints(authorId, 5)

    const { data: story } = await supabase
      .from('stories')
      .select('author_id, title')
      .eq('id', storyId)
      .single()

    if (story && story.author_id !== authorId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authorId)
        .single()
      await notificationsService.create(
        story.author_id,
        `${profile?.full_name || 'Someone'} commented on your story "${story.title}"`
      )
    }

    return data
  },

  async getTimelineStories(familyId) {
    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles!stories_author_id_fkey(*), story_tags(*), reactions(*)')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },
}
