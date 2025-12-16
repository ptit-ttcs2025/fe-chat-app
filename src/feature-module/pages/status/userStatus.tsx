import { useEffect, useState, useRef } from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link, useNavigate } from 'react-router-dom'
import UploadFile from '../../../core/modals/upload-file-image'
import NewStatus from '../../../core/modals/new-status'
import { mockStatusUsers } from '@/mockData/statusData'
import { all_routes } from '../../router/all_routes'
import '../../../assets/css/story-viewer.css'

const UserStatus = () => {
  const navigate = useNavigate()
  const statusUser = mockStatusUsers[0] // Display first friend's status
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<number[]>(Array(statusUser.statuses.length).fill(0))
  const [replyText, setReplyText] = useState('')
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const storyDuration = 5000 // 5 seconds per story

  // Initialize progress tracking
  useEffect(() => {
    const newProgress = [...progress]
    for (let i = 0; i < currentIndex; i++) {
      newProgress[i] = 100
    }
    for (let i = currentIndex; i < newProgress.length; i++) {
      newProgress[i] = i === currentIndex ? 0 : 0
    }
    setProgress(newProgress)
  }, [currentIndex])

  // Auto-advance timer
  useEffect(() => {
    if (!isPaused && currentIndex < statusUser.statuses.length) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = [...prev]
          newProgress[currentIndex] += (100 / storyDuration) * 50
          
          if (newProgress[currentIndex] >= 100) {
            newProgress[currentIndex] = 100
            if (currentIndex < statusUser.statuses.length - 1) {
              setCurrentIndex(currentIndex + 1)
            } else {
              setTimeout(() => navigate(all_routes.status), 300)
            }
          }
          
          return newProgress
        })
      }, 50)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentIndex, isPaused])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      navigate(all_routes.status)
    }
  }

  const handleNext = () => {
    if (currentIndex < statusUser.statuses.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      navigate(all_routes.status)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const handleSendReply = () => {
    if (replyText.trim()) {
      // Here you would send the reply
      console.log('Sending reply:', replyText)
      setReplyText('')
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === ' ') {
        e.preventDefault()
        togglePause()
      } else if (e.key === 'Escape') {
        navigate(all_routes.status)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, isPaused])

  // Swipe gestures
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrevious()
      }
    }
  }

  return (
    <>
      {/* Story Viewer */}
      <div className="chat chat-messages show status-msg justify-content-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="user-status-group">
          {/* Close Button */}
          <div className="d-xl-none">
            <Link className="text-muted chat-close mb-3 d-block" to={all_routes.status}>
              <i className="fas fa-arrow-left" />
            </Link>
          </div>

          {/* Progress Bars */}
          <div className="story-progress-bars">
            {statusUser.statuses.map((_, index) => (
              <div key={index} className="story-progress-bar">
                <div 
                  className="story-progress-fill"
                  style={{
                    transform: `scaleX(${progress[index] / 100})`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Tap Zones */}
          <div className="story-tap-zone-left" onClick={handlePrevious} />
          <div className="story-tap-zone-right" onClick={handleNext} />

          {/* Navigation Arrows (Desktop) */}
          <button className="story-nav-arrow left" onClick={handlePrevious}>
            <i className="ti ti-chevron-left" />
          </button>
          <button className="story-nav-arrow right" onClick={handleNext}>
            <i className="ti ti-chevron-right" />
          </button>

          {/* Story Content */}
          <div className="user-stories-box">
            <div className="inner-popup">
              {/* User Header */}
              <div className="status-user-blk">
                <div className="user-details">
                  <div className="avatar avatar-lg me-2">
                    <ImageWithBasePath
                      src={statusUser.avatar}
                      className="rounded-circle"
                      alt={statusUser.name}
                    />
                  </div>
                  <div className="user-online">
                    <h5>{statusUser.name}</h5>
                    <span>{statusUser.statuses[currentIndex]?.timestamp}</span>
                  </div>
                </div>
                <div className="status-voice-group">
                  <Link 
                    to="#" 
                    className="status-pause me-4" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // Ngăn tap zones bắt event
                      togglePause();
                    }}
                  >
                    <i className={`ti ${isPaused ? 'ti-player-play' : 'ti-player-pause'}`} />
                  </Link>
                  <Link to="#" className="text-white me-2 fs-24">
                    <i className="ti ti-volume" />
                  </Link>
                  <Link to="#" className="text-white fs-24">
                    <i className="ti ti-maximize" />
                  </Link>
                </div>
              </div>

              {/* Story Image */}
              <div className="status_slider">
                <ImageWithBasePath 
                  src={statusUser.statuses[currentIndex]?.image} 
                  alt={`${statusUser.name} - Status ${currentIndex + 1}`}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100vh', 
                    objectFit: 'contain',
                    animation: 'imageZoomIn 0.4s ease-out'
                  }}
                />
              </div>

              {/* Bottom Overlay - Reply */}
              <div className="story-bottom-overlay">
                <div className="story-reply-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Trả lời ${statusUser.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendReply()
                      }
                    }}
                  />
                  <Link to="#" className="action-circle">
                    <i className="ti ti-mood-smile" />
                  </Link>
                  <Link to="#" className="action-circle" onClick={handleSendReply}>
                    <i className="ti ti-send" />
                  </Link>
                </div>
              </div>

              {/* Paused Indicator */}
              {isPaused && (
                <div className="story-paused-indicator">
                  <i className="ti ti-player-pause" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UploadFile />
      <NewStatus />
    </>
  )
}

export default UserStatus
