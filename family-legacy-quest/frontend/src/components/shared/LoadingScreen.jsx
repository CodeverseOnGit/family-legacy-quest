import { motion } from 'framer-motion'
import './LoadingScreen.css'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <motion.div
        className="loading-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="loading-icon">📖</div>
        <h2>Family Legacy Quest</h2>
        <div className="loading-dots">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="loading-dot"
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default LoadingScreen
