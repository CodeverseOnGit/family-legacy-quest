import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiImageAddLine, RiCloseLine, RiAddLine, RiRefreshLine } from 'react-icons/ri'
import { storiesService } from '../services/stories'
import useAuthStore from '../store/authStore'
import { getRandomPrompts } from '../data/prompts'
import toast from 'react-hot-toast'
import './CreateStoryPage.css'

function CreateStoryPage() {
  const { user, family } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef()

  const [form, setForm] = useState({
    title: '',
    prompt: location.state?.prompt || '',
    content: '',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [suggestedPrompts, setSuggestedPrompts] = useState(getRandomPrompts(3))

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag) && form.tags.length < 8) {
      update('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  function removeTag(tag) {
    update('tags', form.tags.filter(t => t !== tag))
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  function refreshPrompts() {
    setSuggestedPrompts(getRandomPrompts(3))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Please add a title'); return }
    if (!form.content.trim()) { toast.error('Please write your story'); return }
    if (!family) { toast.error('You need to be in a family first'); return }

    setLoading(true)
    try {
      const story = await storiesService.createStory({
        familyId: family.id,
        authorId: user.id,
        title: form.title,
        prompt: form.prompt,
        content: form.content,
        tags: form.tags,
      })

      if (imageFile) {
        await storiesService.uploadCoverImage(story.id, imageFile)
      }

      toast.success('Story shared with your family! 🎉 +20 points')
      navigate(`/stories/${story.id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to share story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-story-page">
      <motion.div
        className="create-story-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Share a Story</h1>
        <p>Your memories matter — every story you share earns 20 points</p>
      </motion.div>

      <div className="create-story-layout">
        <motion.form
          className="create-story-form card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Image Upload */}
          <div
            className={`image-upload-area ${imagePreview ? 'has-image' : ''}`}
            onClick={() => !imagePreview && fileInputRef.current.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Cover preview" className="image-preview" />
                <button
                  type="button"
                  className="remove-image"
                  onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                >
                  <RiCloseLine />
                </button>
              </>
            ) : (
              <div className="image-upload-placeholder">
                <RiImageAddLine />
                <span>Add a cover photo (optional)</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              style={{ display: 'none' }}
            />
          </div>

          {/* Prompt */}
          <div className="form-group">
            <label className="form-label">Story Prompt (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="What inspired this story?"
              value={form.prompt}
              onChange={e => update('prompt', e.target.value)}
            />
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Story Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Give your story a title…"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              required
            />
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label">Your Story *</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Tell your story here… share the details, the feelings, the memories that matter."
              value={form.content}
              onChange={e => update('content', e.target.value)}
              rows={10}
              required
            />
            <div className="word-count">{form.content.split(/\s+/).filter(Boolean).length} words</div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tags-input-area">
              {form.tags.map(tag => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}><RiCloseLine /></button>
                </span>
              ))}
              <input
                type="text"
                className="tag-input"
                placeholder="Add a tag…"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
              />
            </div>
            <div className="form-hint">Press Enter or comma to add a tag. Examples: childhood, recipe, travel</div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Sharing…' : '📖 Share with Family'}
            </button>
          </div>
        </motion.form>

        {/* Prompt Suggestions */}
        <motion.aside
          className="prompt-sidebar"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card prompt-suggestions">
            <div className="prompt-suggestions-header">
              <h3>Need inspiration?</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={refreshPrompts}>
                <RiRefreshLine /> Refresh
              </button>
            </div>
            <p>Click a prompt to use it as your story starter</p>
            <div className="prompt-list">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  className="prompt-suggestion-item"
                  onClick={() => {
                    update('prompt', prompt)
                    toast.success('Prompt applied!')
                  }}
                >
                  <span className="prompt-number">{i + 1}</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="card story-tips">
            <h3>Writing Tips</h3>
            <ul>
              <li>Include specific details — dates, places, names</li>
              <li>Share how you felt, not just what happened</li>
              <li>Even small moments make wonderful stories</li>
              <li>Add a photo to bring your story to life</li>
            </ul>
          </div>
        </motion.aside>
      </div>
    </div>
  )
}

export default CreateStoryPage
