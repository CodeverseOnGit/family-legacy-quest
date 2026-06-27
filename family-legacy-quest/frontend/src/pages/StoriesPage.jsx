import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { RiAddLine, RiSearchLine, RiBookOpenLine, RiHeartLine } from 'react-icons/ri'
import { storiesService } from '../services/stories'
import useAuthStore from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import './StoriesPage.css'

function StoryCard({ story, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/stories/${story.id}`} className="story-card card">
        {story.cover_image && (
          <div className="story-card-image">
            <img src={story.cover_image} alt={story.title} />
          </div>
        )}
        <div className="story-card-body">
          {story.story_tags?.length > 0 && (
            <div className="story-tags">
              {story.story_tags.slice(0, 3).map(t => (
                <span key={t.id} className="badge badge-cream">{t.tag}</span>
              ))}
            </div>
          )}
          <h3 className="story-card-title">{story.title}</h3>
          {story.prompt && <p className="story-card-prompt">📝 {story.prompt}</p>}
          <p className="story-card-excerpt">
            {story.content?.length > 150 ? story.content.substring(0, 150) + '…' : story.content}
          </p>
          <div className="story-card-footer">
            <div className="story-author">
              <div className="story-author-avatar">
                {story.profiles?.avatar_url
                  ? <img src={story.profiles.avatar_url} alt="" />
                  : <span>{story.profiles?.full_name?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <div>
                <div className="story-author-name">{story.profiles?.full_name}</div>
                <div className="story-meta">{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</div>
              </div>
            </div>
            <div className="story-stats">
              <span><RiHeartLine /> {story.reactions?.length || 0}</span>
              <span>💬 {story.comments?.[0]?.count || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function StoriesPage() {
  const { family } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const debounce = useCallback((value) => {
    clearTimeout(window._searchTimeout)
    window._searchTimeout = setTimeout(() => setDebouncedSearch(value), 350)
  }, [])

  function handleSearch(e) {
    setSearch(e.target.value)
    debounce(e.target.value)
  }

  const { data: stories, isLoading } = useQuery({
    queryKey: ['stories', family?.id, debouncedSearch],
    queryFn: () => storiesService.getFamilyStories(family.id, { search: debouncedSearch, limit: 20 }),
    enabled: !!family?.id,
  })

  if (!family) {
    return (
      <div className="stories-page">
        <div className="empty-state">
          <div className="empty-state-icon"><RiBookOpenLine /></div>
          <h3>Join a family first</h3>
          <p>You need to be part of a family to see and share stories.</p>
          <Link to="/family" className="btn btn-primary" style={{ marginTop: '1rem' }}>Set Up Your Family</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="stories-page">
      <div className="stories-header">
        <div>
          <h1>Family Stories</h1>
          <p>Memories, moments, and milestones from your family</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/stories/new')}>
          <RiAddLine /> Share Story
        </button>
      </div>

      <div className="stories-search">
        <RiSearchLine className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder="Search stories by title, content, or tag…"
          value={search}
          onChange={handleSearch}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {isLoading ? (
        <div className="stories-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card story-skeleton">
              <div className="skeleton" style={{ height: 160 }} />
              <div style={{ padding: '1rem' }}>
                <div className="skeleton" style={{ height: 20, marginBottom: 8, width: '70%' }} />
                <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : stories?.length > 0 ? (
        <div className="stories-grid">
          {stories.map((story, i) => (
            <StoryCard key={story.id} story={story} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <h3>{debouncedSearch ? 'No stories found' : 'No stories yet'}</h3>
          <p>{debouncedSearch ? `No stories match "${debouncedSearch}"` : 'Be the first in your family to share a story!'}</p>
          {!debouncedSearch && (
            <Link to="/stories/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Share Your First Story
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default StoriesPage
