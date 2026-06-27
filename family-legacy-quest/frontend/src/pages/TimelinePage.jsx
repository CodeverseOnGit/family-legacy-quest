import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { RiTimeLine, RiBookOpenLine } from 'react-icons/ri'
import { storiesService } from '../services/stories'
import useAuthStore from '../store/authStore'
import { format, getYear, getMonth } from 'date-fns'
import './TimelinePage.css'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function TimelineEntry({ story, side }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={`timeline-entry ${side}`}
      initial={{ opacity: 0, x: side === 'left' ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="timeline-dot" />
      <Link to={`/stories/${story.id}`} className="timeline-card card">
        {story.cover_image && (
          <div className="timeline-card-image">
            <img src={story.cover_image} alt={story.title} />
          </div>
        )}
        <div className="timeline-card-body">
          <div className="timeline-card-date">
            {format(new Date(story.created_at), 'MMMM d, yyyy')}
          </div>
          <h4 className="timeline-card-title">{story.title}</h4>
          <p className="timeline-card-excerpt">
            {story.content?.length > 120
              ? story.content.substring(0, 120) + '…'
              : story.content}
          </p>
          <div className="timeline-card-author">
            <div className="timeline-author-avatar">
              {story.profiles?.avatar_url
                ? <img src={story.profiles.avatar_url} alt="" />
                : <span>{story.profiles?.full_name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <span>{story.profiles?.full_name}</span>
          </div>
          {story.reactions?.length > 0 && (
            <div className="timeline-reactions">
              {[...new Set(story.reactions.map(r => r.emoji))].slice(0, 4).join(' ')}
              <span>{story.reactions.length}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function TimelinePage() {
  const { family } = useAuthStore()

  const { data: stories, isLoading } = useQuery({
    queryKey: ['timeline-stories', family?.id],
    queryFn: () => storiesService.getTimelineStories(family.id),
    enabled: !!family?.id,
  })

  // Group stories by year then month
  const grouped = stories?.reduce((acc, story) => {
    const year = getYear(new Date(story.created_at))
    const month = getMonth(new Date(story.created_at))
    if (!acc[year]) acc[year] = {}
    if (!acc[year][month]) acc[year][month] = []
    acc[year][month].push(story)
    return acc
  }, {}) || {}

  const sortedYears = Object.keys(grouped).sort((a, b) => b - a)

  if (!family) {
    return (
      <div className="timeline-page">
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>Join a family first</h3>
          <p>Your family timeline will appear here once you're connected.</p>
          <Link to="/family" className="btn btn-primary" style={{ marginTop: '1rem' }}>Set Up Family</Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="timeline-page">
        <div className="page-header">
          <h1>Family Timeline</h1>
        </div>
        <div className="timeline-loading">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton timeline-skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="timeline-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>📅 Family Timeline</h1>
        <p>A living scrapbook of your family's memories, in order</p>
      </motion.div>

      {stories?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><RiBookOpenLine /></div>
          <h3>Your timeline is waiting</h3>
          <p>Share your first story to start building your family's timeline.</p>
          <Link to="/stories/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>Share a Story</Link>
        </div>
      ) : (
        <div className="timeline-container">
          <div className="timeline-line" />
          {sortedYears.map(year => (
            <div key={year} className="timeline-year-group">
              <motion.div
                className="timeline-year-marker"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <span>{year}</span>
              </motion.div>

              {Object.keys(grouped[year])
                .sort((a, b) => b - a)
                .map(month => (
                  <div key={month} className="timeline-month-group">
                    <motion.div
                      className="timeline-month-label"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      {MONTH_NAMES[month]}
                    </motion.div>
                    {grouped[year][month].map((story, i) => (
                      <TimelineEntry
                        key={story.id}
                        story={story}
                        side={i % 2 === 0 ? 'left' : 'right'}
                      />
                    ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimelinePage
