import { useEffect, useState, useRef } from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link, useNavigate } from 'react-router-dom'
import UploadFile from '../../../core/modals/upload-file-image'
import NewStatus from '../../../core/modals/new-status'
import ViewStatus from '../../../core/modals/view-status'
import { myStatus } from '@/mockData/statusData'
import { all_routes } from '../../router/all_routes'
import '../../../assets/css/story-viewer.css'

const MyStatus = () => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<number[]>(Array(myStatus.statuses.length).fill(0))
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const storyDuration = 5000 // 5 seconds per story

  // Initialize progress tracking
  useEffect(() => {
    const newProgress = [...progress]
    // Set completed progress for previous stories
    for (let i = 0; i < currentIndex; i++) {
      newProgress[i] = 100
    }
    // Reset current and future stories
    for (let i = currentIndex; i < newProgress.length; i++) {
      newProgress[i] = i === currentIndex ? 0 : 0
    }
    setProgress(newProgress)
  }, [currentIndex])

  // Auto-advance timer
  useEffect(() => {
    if (!isPaused && currentIndex < myStatus.statuses.length) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = [...prev]
          newProgress[currentIndex] += (100 / storyDuration) * 50 // Update every 50ms
          
          if (newProgress[currentIndex] >= 100) {
            newProgress[currentIndex] = 100
            // Move to next story
            if (currentIndex < myStatus.statuses.length - 1) {
              setCurrentIndex(currentIndex + 1)
            } else {
              // End of stories, navigate back
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
    if (currentIndex < myStatus.statuses.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      navigate(all_routes.status)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
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

    if (Math.abs(diff) > 50) { // Minimum swipe distance
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
            {myStatus.statuses.map((_, index) => (
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
                      src={myStatus.avatar}
                      className="rounded-circle"
                      alt="Trạng thái của tôi"
                    />
                  </div>
                  <div className="user-online">
                    <h5>Trạng thái của tôi</h5>
                    <span>{myStatus.statuses[currentIndex]?.timestamp}</span>
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
                  src={myStatus.statuses[currentIndex]?.image} 
                  alt={`Status ${currentIndex + 1}`}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100vh', 
                    objectFit: 'contain',
                    animation: 'imageZoomIn 0.4s ease-out'
                  }}
                />
              </div>

              {/* View Count */}
              <Link
                to="#"
                className="view-status-list br-8 py-1 px-2 position-absolute"
                data-bs-toggle="modal"
                data-bs-target="#view-status"
              >
                <i className="ti ti-eye-check me-2" />
                <span className="text-white">{myStatus.viewedBy}</span>
              </Link>

              {/* Bottom Overlay - Reply */}
              <div className="story-bottom-overlay">
                <div className="story-reply-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Gửi tin nhắn..."
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                  />
                  <Link to="#" className="action-circle">
                    <i className="ti ti-mood-smile" />
                  </Link>
                  <Link to="#" className="action-circle">
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
      <ViewStatus />
    </>
  )
}

export default MyStatus
