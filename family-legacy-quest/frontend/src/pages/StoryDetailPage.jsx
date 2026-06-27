import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RiArrowLeftLine, RiEditLine, RiDeleteBinLine,
  RiSendPlaneLine, RiHeartLine, RiHeartFill
} from 'react-icons/ri'
import { storiesService } from '../services/stories'
import useAuthStore from '../store/authStore'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './StoryDetailPage.css'

const EMOJIS = ['❤️', '😄', '😢', '🎉', '👏', '🥰']

function StoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, family } = useAuthStore()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: () => storiesService.getStory(id),
  })

  const reactionMutation = useMutation({
    mutationFn: ({ emoji }) => storiesService.addReaction(id, user.id, emoji),
    onSuccess: () => queryClient.invalidateQueries(['story', id]),
  })

  async function handleComment(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setCommentLoading(true)
    try {
      await storiesService.addComment(id, user.id, comment, family?.id)
      setComment('')
      queryClient.invalidateQueries(['story', id])
      toast.success('Comment added! +5 points')
    } catch (err) {
      toast.error('Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  async function handleDelete() {
    try {
      await storiesService.deleteStory(id)
      toast.success('Story deleted')
      navigate('/stories')
    } catch {
      toast.error('Failed to delete story')
    }
  }

  if (isLoading) {
    return (
      <div className="story-detail-page">
        <div className="story-detail-skeleton">
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 32, width: '60%', marginTop: '1.5rem' }} />
          <div className="skeleton" style={{ height: 18, marginTop: '0.75rem' }} />
          <div className="skeleton" style={{ height: 18, marginTop: '0.5rem' }} />
          <div className="skeleton" style={{ height: 18, width: '70%', marginTop: '0.5rem' }} />
        </div>
      </div>
    )
  }

  if (!story) return (
    <div className="story-detail-page">
      <div className="empty-state">
        <div className="empty-state-icon">📖</div>
        <h3>Story not found</h3>
        <Link to="/stories" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Stories</Link>
      </div>
    </div>
  )

  const isAuthor = story.author_id === user?.id

  // Group reactions by emoji
  const reactionGroups = story.reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || [])
    acc[r.emoji].push(r)
    return acc
  }, {}) || {}

  const userReactions = story.reactions?.filter(r => r.user_id === user?.id).map(r => r.emoji) || []

  return (
    <div className="story-detail-page">
      <motion.div
        className="story-detail-nav"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <RiArrowLeftLine /> Back
        </button>
        {isAuthor && (
          <div className="story-author-actions">
            <Link to={`/stories/${id}/edit`} className="btn btn-ghost">
              <RiEditLine /> Edit
            </Link>
            {!deleteConfirm ? (
              <button className="btn btn-ghost" style={{ color: '#DC3545' }} onClick={() => setDeleteConfirm(true)}>
                <RiDeleteBinLine /> Delete
              </button>
            ) : (
              <div className="delete-confirm">
                <span>Are you sure?</span>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>Yes, delete</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <motion.article
        className="story-article"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {story.cover_image && (
          <div className="story-hero-image">
            <img src={story.cover_image} alt={story.title} />
          </div>
        )}

        <div className="story-article-body">
          {story.prompt && (
            <div className="story-prompt-badge">
              <span>✍️ Prompted by:</span> {story.prompt}
            </div>
          )}

          <h1 className="story-article-title">{story.title}</h1>

          <div className="story-article-meta">
            <div className="story-author-info">
              <div className="story-author-avatar-lg">
                {story.profiles?.avatar_url
                  ? <img src={story.profiles.avatar_url} alt="" />
                  : <span>{story.profiles?.full_name?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <div className="story-author-name-lg">{story.profiles?.full_name}</div>
                <div className="story-date">{format(new Date(story.created_at), 'MMMM d, yyyy')}</div>
              </div>
            </div>
            {story.story_tags?.length > 0 && (
              <div className="story-tags-list">
                {story.story_tags.map(t => (
                  <span key={t.id} className="badge badge-cream">{t.tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="story-content">
            {story.content.split('\n').map((para, i) => (
              para.trim() ? <p key={i}>{para}</p> : <br key={i} />
            ))}
          </div>

          {/* Reactions */}
          <div className="story-reactions">
            <div className="reaction-emojis">
              {EMOJIS.map(emoji => {
                const count = reactionGroups[emoji]?.length || 0
                const hasReacted = userReactions.includes(emoji)
                return (
                  <button
                    key={emoji}
                    className={`reaction-btn ${hasReacted ? 'reacted' : ''}`}
                    onClick={() => reactionMutation.mutate({ emoji })}
                    title={hasReacted ? 'Remove reaction' : 'Add reaction'}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span className="reaction-count">{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comments */}
          <div className="story-comments">
            <h3>Comments ({story.comments?.length || 0})</h3>

            {story.comments?.map((c, i) => (
              <motion.div
                key={c.id}
                className="comment-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="comment-avatar">
                  {c.profiles?.avatar_url
                    ? <img src={c.profiles.avatar_url} alt="" />
                    : <span>{c.profiles?.full_name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{c.profiles?.full_name}</span>
                    <span className="comment-time">{format(new Date(c.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <p className="comment-text">{c.content}</p>
                </div>
              </motion.div>
            ))}

            <form className="comment-form" onSubmit={handleComment}>
              <div className="comment-input-row">
                <div className="comment-avatar">
                  <span>{user?.email?.[0]?.toUpperCase()}</span>
                </div>
                <div className="comment-input-wrapper">
                  <textarea
                    className="form-input"
                    placeholder="Add a comment… (+5 points)"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm comment-submit"
                    disabled={!comment.trim() || commentLoading}
                  >
                    <RiSendPlaneLine />
                    {commentLoading ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.article>
    </div>
  )
}

export default StoryDetailPage
