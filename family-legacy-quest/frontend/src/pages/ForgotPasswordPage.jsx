import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiMailLine } from 'react-icons/ri'
import { authService } from '../services/auth'
import toast from 'react-hot-toast'
import './AuthPages.css'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await authService.resetPassword(email)
      setSent(true)
      toast.success('Reset email sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="auth-card-header">
        <h2>Reset your password</h2>
        <p>Enter your email and we'll send you a reset link</p>
      </div>

      {sent ? (
        <div className="auth-success-state">
          <div className="auth-success-icon">📧</div>
          <h3>Check your inbox</h3>
          <p>We sent a reset link to <strong>{email}</strong>. Check your email and follow the instructions.</p>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <RiMailLine className="input-icon" />
              <input
                type="email"
                className="form-input input-with-icon"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <div className="auth-card-bottom">
        <p><Link to="/login" className="auth-link">← Back to Sign In</Link></p>
      </div>
    </motion.div>
  )
}

export default ForgotPasswordPage
