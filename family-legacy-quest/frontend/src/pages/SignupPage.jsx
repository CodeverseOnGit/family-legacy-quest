import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiMailLine, RiLockLine, RiUserLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import { authService } from '../services/auth'
import toast from 'react-hot-toast'
import './AuthPages.css'

function SignupPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await authService.signUp(form.email, form.password, form.fullName)
      toast.success('Account created! Check your email to confirm.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-card-header">
        <h2>Start your family legacy</h2>
        <p>Create an account and begin preserving your family's stories</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="input-wrapper">
            <RiUserLine className="input-icon" />
            <input
              type="text"
              className="form-input input-with-icon"
              placeholder="Your full name"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-wrapper">
            <RiMailLine className="input-icon" />
            <input
              type="email"
              className="form-input input-with-icon"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-wrapper">
            <RiLockLine className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input input-with-icon input-with-action"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
            />
            <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div className="input-wrapper">
            <RiLockLine className="input-icon" />
            <input
              type="password"
              className="form-input input-with-icon"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => update('confirm', e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-card-bottom">
        <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
      </div>
    </motion.div>
  )
}

export default SignupPage
