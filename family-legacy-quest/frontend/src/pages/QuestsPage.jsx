import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RiTrophyLine, RiCheckboxCircleLine, RiStarLine, RiLockLine } from 'react-icons/ri'
import { questsService } from '../services/quests'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import './QuestsPage.css'

function QuestCard({ quest, completion, index, onComplete, completing }) {
  const isCompleted = !!completion

  return (
    <motion.div
      className={`quest-card card ${isCompleted ? 'quest-completed' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="quest-card-top">
        <div className="quest-icon-wrap">
          {isCompleted ? <RiCheckboxCircleLine className="quest-done-icon" /> : <RiTrophyLine className="quest-trophy-icon" />}
        </div>
        <div className="quest-info">
          <h3 className="quest-title">{quest.title}</h3>
          <p className="quest-description">{quest.description}</p>
        </div>
        <div className="quest-points-badge">
          <RiStarLine />
          {quest.reward_points} pts
        </div>
      </div>

      <div className="quest-card-footer">
        {isCompleted ? (
          <div className="quest-completion-info">
            <RiCheckboxCircleLine />
            Completed {formatDistanceToNow(new Date(completion.completed_at), { addSuffix: true })}
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onComplete(quest.id)}
            disabled={completing}
          >
            {completing ? 'Completing…' : 'Mark Complete'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function QuestsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [completing, setCompleting] = useState(null)

  const { data: quests, isLoading: questsLoading } = useQuery({
    queryKey: ['active-quests'],
    queryFn: questsService.getActiveQuests,
  })

  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ['quest-completions', user?.id],
    queryFn: () => questsService.getUserCompletions(user.id),
    enabled: !!user?.id,
  })

  async function handleComplete(questId) {
    setCompleting(questId)
    try {
      await questsService.completeQuest(questId, user.id)
      queryClient.invalidateQueries(['quest-completions', user.id])
      queryClient.invalidateQueries(['profile', user.id])
      toast.success('Quest completed! 🏆 Points added!')
    } catch (err) {
      toast.error(err.message || 'Failed to complete quest')
    } finally {
      setCompleting(null)
    }
  }

  const completionMap = completions?.reduce((acc, c) => {
    acc[c.quest_id] = c
    return acc
  }, {}) || {}

  const completedCount = completions?.length || 0
  const totalPoints = completions?.reduce((sum, c) => sum + (c.quests?.reward_points || 0), 0) || 0

  return (
    <div className="quests-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>🏆 Family Quests</h1>
        <p>Complete challenges to earn points and bring your family closer together</p>
      </motion.div>

      {/* Stats Banner */}
      <motion.div
        className="quests-stats-banner card"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="quest-stat">
          <div className="quest-stat-value">{completedCount}</div>
          <div className="quest-stat-label">Quests Completed</div>
        </div>
        <div className="quest-stat-divider" />
        <div className="quest-stat">
          <div className="quest-stat-value">{(quests?.length || 0) - completedCount}</div>
          <div className="quest-stat-label">Remaining</div>
        </div>
        <div className="quest-stat-divider" />
        <div className="quest-stat">
          <div className="quest-stat-value">{totalPoints}</div>
          <div className="quest-stat-label">Points Earned</div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      {quests?.length > 0 && (
        <motion.div
          className="quests-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="quests-progress-header">
            <span>Your Progress</span>
            <span>{completedCount} / {quests.length}</span>
          </div>
          <div className="quests-progress-bar">
            <motion.div
              className="quests-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / quests.length) * 100}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {/* Quest Sections */}
      <div className="quests-sections">
        {/* Active Quests */}
        <div className="quests-section">
          <h2 className="quests-section-title">Active Quests</h2>
          {questsLoading ? (
            <div className="quests-grid">
              {[1,2,3,4].map(i => (
                <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : (
            <div className="quests-grid">
              {quests
                ?.filter(q => !completionMap[q.id])
                .map((quest, i) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    completion={null}
                    index={i}
                    onComplete={handleComplete}
                    completing={completing === quest.id}
                  />
                ))}
              {quests?.filter(q => !completionMap[q.id]).length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🎉</div>
                  <h3>All quests completed!</h3>
                  <p>Amazing! You've finished every quest. More coming soon.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Completed Quests */}
        {completedCount > 0 && (
          <div className="quests-section">
            <h2 className="quests-section-title">
              <RiCheckboxCircleLine style={{ color: 'var(--forest-green)' }} />
              Completed ({completedCount})
            </h2>
            <div className="quests-grid">
              {quests
                ?.filter(q => completionMap[q.id])
                .map((quest, i) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    completion={completionMap[quest.id]}
                    index={i}
                    onComplete={handleComplete}
                    completing={false}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// useState import fix
import { useState } from 'react'

export default QuestsPage
