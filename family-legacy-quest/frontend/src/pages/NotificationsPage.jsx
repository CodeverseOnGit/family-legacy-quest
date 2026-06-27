import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RiBellLine, RiCheckDoubleLine } from 'react-icons/ri'
import { notificationsService } from '../services/notifications'
import useAuthStore from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import './NotificationsPage.css'

function NotificationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsService.getUserNotifications(user.id, { limit: 50 }),
    enabled: !!user?.id,
  })

  async function markAllRead() {
    try {
      await notificationsService.markAllRead(user.id)
      queryClient.invalidateQueries(['notifications', user.id])
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark notifications as read')
    }
  }

  async function markOneRead(id) {
    try {
      await notificationsService.markRead(id)
      queryClient.invalidateQueries(['notifications', user.id])
    } catch {}
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  return (
    <div className="notifications-page">
      <motion.div
        className="notifications-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>🔔 Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={markAllRead}>
            <RiCheckDoubleLine /> Mark all read
          </button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="notifications-list">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton notification-skeleton" />
          ))}
        </div>
      ) : notifications?.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-state-icon"><RiBellLine /></div>
          <h3>No notifications yet</h3>
          <p>When family members share stories or complete quests, you'll hear about it here.</p>
        </motion.div>
      ) : (
        <motion.div
          className="notifications-list card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              className={`notification-item ${!n.read ? 'notification-unread' : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => !n.read && markOneRead(n.id)}
            >
              <div className="notification-dot-wrap">
                <div className={`notification-dot ${!n.read ? 'dot-active' : ''}`} />
              </div>
              <div className="notification-content">
                <p className="notification-message">{n.message}</p>
                <span className="notification-time">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              {!n.read && (
                <span className="notification-new-badge">New</span>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default NotificationsPage
