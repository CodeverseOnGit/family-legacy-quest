import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RiTeamLine, RiAddLine, RiLoginBoxLine, RiClipboardLine, RiCheckLine } from 'react-icons/ri'
import { familiesService } from '../services/families'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import './FamilyPage.css'

function FamilyPage() {
  const { user, family, refreshFamily } = useAuthStore()
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const queryClient = useQueryClient()

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['family-members', family?.id],
    queryFn: () => familiesService.getFamilyMembers(family.id),
    enabled: !!family?.id,
  })

  const { data: stats } = useQuery({
    queryKey: ['family-stats', family?.id],
    queryFn: () => familiesService.getFamilyStats(family.id),
    enabled: !!family?.id,
  })

  const createMutation = useMutation({
    mutationFn: () => familiesService.createFamily(familyName, user.id),
    onSuccess: () => {
      toast.success('Family created! 🎉')
      queryClient.invalidateQueries(['family-members'])
      refreshFamily()
      setMode(null)
    },
    onError: (err) => toast.error(err.message || 'Failed to create family'),
  })

  const joinMutation = useMutation({
    mutationFn: () => familiesService.joinFamily(inviteCode, user.id),
    onSuccess: () => {
      toast.success('Joined family! 🎉')
      refreshFamily()
      setMode(null)
    },
    onError: (err) => toast.error(err.message || 'Failed to join family'),
  })

  async function copyCode() {
    await navigator.clipboard.writeText(family.invite_code)
    setCodeCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (!family) {
    return (
      <div className="family-page">
        <div className="page-header">
          <h1>My Family</h1>
          <p>Create a new family space or join an existing one</p>
        </div>

        {!mode && (
          <div className="family-setup">
            <motion.button
              className="family-setup-option"
              whileHover={{ scale: 1.02 }}
              onClick={() => setMode('create')}
            >
              <div className="setup-icon">🏡</div>
              <h3>Create a Family</h3>
              <p>Start a new family space and invite members to join</p>
            </motion.button>
            <motion.button
              className="family-setup-option"
              whileHover={{ scale: 1.02 }}
              onClick={() => setMode('join')}
            >
              <div className="setup-icon">🔑</div>
              <h3>Join a Family</h3>
              <p>Enter an invite code to join an existing family space</p>
            </motion.button>
          </div>
        )}

        {mode === 'create' && (
          <motion.div className="card family-form-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3>Create Your Family</h3>
            <div className="form-group">
              <label className="form-label">Family Name</label>
              <input
                className="form-input"
                placeholder="e.g. The Johnson Family"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
              />
            </div>
            <div className="family-form-actions">
              <button className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => createMutation.mutate()}
                disabled={!familyName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Family'}
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div className="card family-form-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3>Join a Family</h3>
            <div className="form-group">
              <label className="form-label">Invite Code</label>
              <input
                className="form-input"
                placeholder="e.g. ABCD12"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ fontFamily: 'monospace', letterSpacing: '0.2em', fontSize: '1.2rem' }}
              />
            </div>
            <div className="family-form-actions">
              <button className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => joinMutation.mutate()}
                disabled={inviteCode.length < 6 || joinMutation.isPending}
              >
                {joinMutation.isPending ? 'Joining...' : 'Join Family'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="family-page">
      <div className="page-header">
        <h1>{family.name}</h1>
        <p>Your family space — share memories, complete quests, and stay connected</p>
      </div>

      <div className="family-grid">
        {/* Family Stats */}
        <motion.div className="card family-stats-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Family Stats</h3>
          <div className="family-stat-row">
            <span>📖 Stories Shared</span>
            <strong>{stats?.stories || 0}</strong>
          </div>
          <div className="family-stat-row">
            <span>👥 Family Members</span>
            <strong>{stats?.members || 0}</strong>
          </div>
          <div className="family-stat-row">
            <span>🏆 Quests Completed</span>
            <strong>{stats?.quests || 0}</strong>
          </div>
        </motion.div>

        {/* Invite Code */}
        <motion.div
          className="card invite-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>Invite Family Members</h3>
          <p>Share this code with family members so they can join your space</p>
          <div className="invite-code-display">
            <span className="invite-code">{family.invite_code}</span>
            <button className="btn btn-ghost" onClick={copyCode}>
              {codeCopied ? <RiCheckLine /> : <RiClipboardLine />}
              {codeCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </motion.div>

        {/* Members List */}
        <motion.div
          className="card family-members-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3><RiTeamLine style={{ verticalAlign: 'middle' }} /> Family Members ({members?.length || 0})</h3>
          {membersLoading ? (
            <div className="members-loading">
              {[1,2,3].map(i => <div key={i} className="skeleton member-skeleton" />)}
            </div>
          ) : (
            <div className="members-list">
              {members?.map(member => (
                <div key={member.id} className="member-item">
                  <div className="member-avatar">
                    {member.profiles?.avatar_url
                      ? <img src={member.profiles.avatar_url} alt={member.profiles.full_name} />
                      : <span>{member.profiles?.full_name?.[0]?.toUpperCase() || '?'}</span>
                    }
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.profiles?.full_name || 'Family Member'}
                      {member.user_id === family.created_by && (
                        <span className="badge badge-orange" style={{ marginLeft: 8 }}>Admin</span>
                      )}
                    </div>
                    <div className="member-meta">
                      ⭐ {member.profiles?.points || 0} pts · Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default FamilyPage
