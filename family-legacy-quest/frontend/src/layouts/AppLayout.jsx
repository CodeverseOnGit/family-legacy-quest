import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiHome4Line, RiTeamLine, RiTimeLine, RiBookOpenLine,
  RiTrophyLine, RiUserLine, RiBellLine, RiLogoutBoxLine,
  RiMenuLine, RiCloseLine, RiAddLine
} from 'react-icons/ri'
import { authService } from '../services/auth'
import { notificationsService } from '../services/notifications'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import './AppLayout.css'

const navItems = [
  { to: '/dashboard', icon: RiHome4Line, label: 'Home' },
  { to: '/family', icon: RiTeamLine, label: 'My Family' },
  { to: '/timeline', icon: RiTimeLine, label: 'Timeline' },
  { to: '/stories', icon: RiBookOpenLine, label: 'Stories' },
  { to: '/quests', icon: RiTrophyLine, label: 'Quests' },
  { to: '/profile', icon: RiUserLine, label: 'Profile' },
  { to: '/notifications', icon: RiBellLine, label: 'Notifications' },
]

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, profile, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!user) return
    loadUnreadCount()
    const channel = notificationsService.subscribeToNotifications(user.id, () => {
      setUnreadCount(c => c + 1)
    })
    return () => { if (channel) channel.unsubscribe() }
  }, [user])

  async function loadUnreadCount() {
    try {
      const notifications = await notificationsService.getUserNotifications(user.id)
      setUnreadCount(notifications.filter(n => !n.read).length)
    } catch {}
  }

  async function handleLogout() {
    try {
      await authService.signOut()
      logout()
      navigate('/login')
      toast.success('Signed out successfully')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-icon">📖</span>
            <span className="sidebar-brand-name">Family Legacy</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <RiCloseLine />
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} />
              : <span>{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.full_name || 'Family Member'}</div>
            <div className="sidebar-user-points">⭐ {profile?.points || 0} points</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Icon className="nav-icon" />
              <span>{label}</span>
              {to === '/notifications' && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-create-story" onClick={() => navigate('/stories/new')}>
            <RiAddLine />
            Share a Story
          </button>
          <button className="sidebar-logout" onClick={handleLogout}>
            <RiLogoutBoxLine />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main">
        <header className="app-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <RiMenuLine />
          </button>
          <div className="header-brand">
            <span>📖</span>
            <span>Family Legacy Quest</span>
          </div>
          <div className="header-actions">
            <button className="header-notif" onClick={() => navigate('/notifications')}>
              <RiBellLine />
              {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
            </button>
            <button className="header-avatar" onClick={() => navigate('/profile')}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" />
                : <span>{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
              }
            </button>
          </div>
        </header>

        <main className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
