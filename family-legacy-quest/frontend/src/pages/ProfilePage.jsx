import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RiEditLine, RiSaveLine, RiImageAddLine, RiTrophyLine, RiBookOpenLine, RiStarLine } from 'react-icons/ri'
import { profilesService } from '../services/profiles'
import { questsService } from '../services/quests'
import { supabase } from '../services/supabase'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import './ProfilePage.css'

const BADGE_ICONS = {
  'Storyteller': '📖',
  'Historian': '🏛️',
  'Legacy Keeper': '🗝️',
  'Memory Master': '🧠',
}

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuthStore()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef()

  const { data: badges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: () => profilesService.getUserBadges(user.id),
    enabled: !!user?.id,
  })

  const { data: completions } = useQuery({
    queryKey: ['quest-completions', user?.id],
    queryFn: () => questsService.getUserCompletions(user.id),
    enabled: !!user?.id,
  })

  const { data: stories } = useQuery({
    queryKey: ['my-stories', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('stories')
        .select('*, story_tags(*)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)
      return data
    },
    enabled: !!user?.id,
  })

  async function handleSave() {
    if (!fullName.trim()) return
    setSaving(true)
    try {
      await profilesService.updateProfile(user.id, { full_name: fullName })
      await refreshProfile()
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setUploading(true)
    try {
      await profilesService.uploadAvatar(user.id, file)
      await refreshProfile()
      toast.success('Avatar updated!')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const nextBadgeThresholds = [
    { name: 'Storyteller', at: 10 },
    { name: 'Historian', at: 25 },
    { name: 'Legacy Keeper', at: 50 },
    { name: 'Memory Master', at: 100 },
  ]
  const storiesCount = stories?.length || 0
  const nextBadge = nextBadgeThresholds.find(b => storiesCount < b.at)

  return (
    <div className="profile-page">
      <motion.div
        className="profile-hero card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrap">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} className="profile-avatar-img" />
              : <span className="profile-avatar-initial">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
            }
            <button
              className="profile-avatar-edit"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              title="Change avatar"
            >
              <RiImageAddLine />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="profile-info">
          {editing ? (
            <div className="profile-edit-row">
              <input
                className="form-input profile-name-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                <RiSaveLine /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setFullName(profile?.full_name || '') }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="profile-name-row">
              <h1>{profile?.full_name || 'Family Member'}</h1>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                <RiEditLine /> Edit
              </button>
            </div>
          )}
          <p className="profile-email">{user?.email}</p>
          <div className="profile-stats-row">
            <div className="profile-stat">
              <RiStarLine className="profile-stat-icon" />
              <strong>{profile?.points || 0}</strong>
              <span>Points</span>
            </div>
            <div className="profile-stat">
              <RiBookOpenLine className="profile-stat-icon" />
              <strong>{storiesCount}</strong>
              <span>Stories</span>
            </div>
            <div className="profile-stat">
              <RiTrophyLine className="profile-stat-icon" />
              <strong>{completions?.length || 0}</strong>
              <span>Quests</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="profile-grid">
        {/* Badges */}
        <motion.div
          className="card profile-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>🏅 Badges Earned</h2>
          {badges?.length > 0 ? (
            <div className="badges-grid">
              {badges.map(ub => (
                <div key={ub.id} className="badge-card">
                  <div className="badge-card-icon">
                    {BADGE_ICONS[ub.badges?.name] || '🏅'}
                  </div>
                  <div className="badge-card-name">{ub.badges?.name}</div>
                  <div className="badge-card-desc">{ub.badges?.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-xl) 0' }}>
              <div className="empty-state-icon">🏅</div>
              <h3>No badges yet</h3>
              <p>Share 10 stories to earn your first badge!</p>
            </div>
          )}

          {nextBadge && (
            <div className="next-badge-progress">
              <div className="next-badge-header">
                <span>Next: <strong>{nextBadge.name}</strong></span>
                <span>{storiesCount} / {nextBadge.at} stories</span>
              </div>
              <div className="quests-progress-bar">
                <div
                  className="quests-progress-fill"
                  style={{ width: `${Math.min(100, (storiesCount / nextBadge.at) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Stories */}
        <motion.div
          className="card profile-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2>📖 My Stories</h2>
          {stories?.length > 0 ? (
            <div className="profile-stories-list">
              {stories.map(story => (
                <a key={story.id} href={`/stories/${story.id}`} className="profile-story-item">
                  <div className="profile-story-info">
                    <div className="profile-story-title">{story.title}</div>
                    <div className="profile-story-meta">
                      {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                      {story.story_tags?.length > 0 && ` · ${story.story_tags.map(t => t.tag).join(', ')}`}
                    </div>
                  </div>
                  {story.cover_image && (
                    <img src={story.cover_image} alt="" className="profile-story-thumb" />
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-xl) 0' }}>
              <div className="empty-state-icon">📝</div>
              <h3>No stories yet</h3>
              <p>Your stories will appear here.</p>
            </div>
          )}
        </motion.div>

        {/* Quest History */}
        <motion.div
          className="card profile-section"
          style={{ gridColumn: 'span 2' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2>🏆 Quest History</h2>
          {completions?.length > 0 ? (
            <div className="quest-history-list">
              {completions.map(c => (
                <div key={c.id} className="quest-history-item">
                  <div className="quest-history-icon">🏆</div>
                  <div className="quest-history-info">
                    <div className="quest-history-title">{c.quests?.title}</div>
                    <div className="quest-history-meta">
                      Completed {formatDistanceToNow(new Date(c.completed_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="quest-history-points">+{c.quests?.reward_points} pts</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-xl) 0' }}>
              <div className="empty-state-icon">🏆</div>
              <h3>No quests completed yet</h3>
              <p>Head to the Quests page to complete your first challenge!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ProfilePage
