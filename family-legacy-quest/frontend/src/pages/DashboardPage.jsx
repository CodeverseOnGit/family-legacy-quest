import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  RiBookOpenLine, RiTeamLine, RiTrophyLine, RiStarLine,
  RiAddLine, RiArrowRightLine, RiQuillPenLine
} from 'react-icons/ri'
import { storiesService } from '../services/stories'
import { questsService } from '../services/quests'
import { familiesService } from '../services/families'
import { notificationsService } from '../services/notifications'
import useAuthStore from '../store/authStore'
import { getWeeklyPrompt } from '../data/prompts'
import { formatDistanceToNow } from 'date-fns'
import './DashboardPage.css'

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      className={`stat-card stat-card-${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="stat-icon"><Icon /></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  )
}

function DashboardPage() {
  const { user, profile, family } = useAuthStore()
  const navigate = useNavigate()
  const weeklyPrompt = getWeeklyPrompt()

  const { data: stats } = useQuery({
    queryKey: ['family-stats', family?.id],
    queryFn: () => familiesService.getFamilyStats(family.id),
    enabled: !!family?.id,
  })

  const { data: recentStories } = useQuery({
    queryKey: ['recent-stories', family?.id],
    queryFn: () => storiesService.getFamilyStories(family.id, { limit: 4 }),
    enabled: !!family?.id,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsService.getUserNotifications(user.id, { limit: 5 }),
    enabled: !!user?.id,
  })

  const { data: quests } = useQuery({
    queryKey: ['active-quests'],
    queryFn: questsService.getActiveQuests,
  })

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="dashboard">
      <motion.div
        className="dashboard-welcome"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>{greeting}, {firstName} 👋</h1>
          <p>{family ? `Welcome to the ${family.name} family space` : 'Welcome to Family Legacy Quest'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/stories/new')}>
          <RiAddLine /> Share a Story
        </button>
      </motion.div>

      {!family && (
        <motion.div
          className="no-family-banner"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="no-family-text">
            <h3>You haven't joined a family yet</h3>
            <p>Create a new family space or join one with an invite code to start sharing memories.</p>
          </div>
          <Link to="/family" className="btn btn-primary">Get Started</Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="dashboard-stats">
        <StatCard icon={RiBookOpenLine} label="Stories Shared" value={stats?.stories || 0} color="orange" delay={0.1} />
        <StatCard icon={RiTeamLine} label="Family Members" value={stats?.members || 0} color="blue" delay={0.15} />
        <StatCard icon={RiTrophyLine} label="Quests Completed" value={stats?.quests || 0} color="green" delay={0.2} />
        <StatCard icon={RiStarLine} label="Points Earned" value={profile?.points || 0} color="purple" delay={0.25} />
      </div>

      <div className="dashboard-grid">
        {/* Weekly Prompt */}
        <motion.div
          className="dashboard-prompt card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="dashboard-section-header">
            <RiQuillPenLine className="section-icon" />
            <h3>This Week's Prompt</h3>
          </div>
          <blockquote className="prompt-quote">"{weeklyPrompt}"</blockquote>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/stories/new', { state: { prompt: weeklyPrompt } })}
          >
            Write Your Story
          </button>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="dashboard-activity card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="dashboard-section-header">
            <span className="section-icon">🔔</span>
            <h3>Recent Activity</h3>
            <Link to="/notifications" className="section-link">View all <RiArrowRightLine /></Link>
          </div>
          {notifications?.length > 0 ? (
            <div className="activity-list">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className={`activity-item ${!n.read ? 'activity-unread' : ''}`}>
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <p>{n.message}</p>
                    <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No activity yet. Start by sharing a story!</p>
            </div>
          )}
        </motion.div>

        {/* Recent Stories */}
        {family && (
          <motion.div
            className="dashboard-stories card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="dashboard-section-header">
              <RiBookOpenLine className="section-icon" />
              <h3>Recent Stories</h3>
              <Link to="/stories" className="section-link">See all <RiArrowRightLine /></Link>
            </div>
            {recentStories?.length > 0 ? (
              <div className="recent-stories-grid">
                {recentStories.slice(0, 4).map(story => (
                  <Link key={story.id} to={`/stories/${story.id}`} className="mini-story-card">
                    {story.cover_image && (
                      <div className="mini-story-img">
                        <img src={story.cover_image} alt={story.title} />
                      </div>
                    )}
                    <div className="mini-story-body">
                      <h4>{story.title}</h4>
                      <span>by {story.profiles?.full_name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No stories yet. Be the first to share one!</p>
                <Link to="/stories/new" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  Share Your First Story
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Quests */}
        <motion.div
          className="dashboard-quests card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="dashboard-section-header">
            <RiTrophyLine className="section-icon" />
            <h3>Active Quests</h3>
            <Link to="/quests" className="section-link">View all <RiArrowRightLine /></Link>
          </div>
          {quests?.slice(0, 3).map(quest => (
            <div key={quest.id} className="mini-quest">
              <div className="mini-quest-info">
                <span className="mini-quest-title">{quest.title}</span>
                <span className="mini-quest-points">+{quest.reward_points} pts</span>
              </div>
              <p className="mini-quest-desc">{quest.description}</p>
            </div>
          ))}
          <Link to="/quests" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }}>
            Complete Quests
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage
