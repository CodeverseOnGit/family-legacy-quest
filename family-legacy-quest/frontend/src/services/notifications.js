import { supabase } from './supabase'

export const notificationsService = {
  async create(userId, message) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, message, read: false })
      .select()
      .single()
    if (error) console.error('Notification error:', error)
    return data
  },

  async getUserNotifications(userId, { limit = 20 } = {}) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async markRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    if (error) throw error
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
    if (error) throw error
  },

  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  },
}
