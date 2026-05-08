import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  isTutorialVideoId,
  TUTORIAL_VIDEO_DURATION_SECONDS,
  TUTORIAL_VIDEO_METADATA,
  TUTORIAL_VIDEO_YOUTUBE_ID,
} from './tutorialConfig'

interface TutorialVideoInitialState {
  showSpinner: boolean
  title: string
  author: string
  publishedAt: string
  views: string
  likes: string
  durationSeconds: number
}

interface UseTutorialVideoAdapterResult {
  videoId?: string
  isBlockedTutorialVideo: boolean
  initialVideoState: TutorialVideoInitialState
  tutorialDocumentTitle: string
}

export const useTutorialVideoAdapter = (
  isTutorialMode: boolean,
): UseTutorialVideoAdapterResult => {
  const { videoId: routeVideoId } = useParams()
  const navigate = useNavigate()
  const isBlockedTutorialVideo =
    !isTutorialMode && isTutorialVideoId(routeVideoId)
  const videoId = isTutorialMode ? TUTORIAL_VIDEO_YOUTUBE_ID : routeVideoId

  useEffect(() => {
    if (isBlockedTutorialVideo) {
      navigate('/not-found', { replace: true })
    }
  }, [isBlockedTutorialVideo, navigate])

  return {
    videoId,
    isBlockedTutorialVideo,
    initialVideoState: {
      showSpinner: !isTutorialMode,
      title: isTutorialMode ? TUTORIAL_VIDEO_METADATA.title : '',
      author: isTutorialMode ? TUTORIAL_VIDEO_METADATA.author : '',
      publishedAt: isTutorialMode ? TUTORIAL_VIDEO_METADATA.publishedAt : '',
      views: isTutorialMode ? TUTORIAL_VIDEO_METADATA.views : '',
      likes: isTutorialMode ? TUTORIAL_VIDEO_METADATA.likes : '',
      durationSeconds: isTutorialMode ? TUTORIAL_VIDEO_DURATION_SECONDS : 0,
    },
    tutorialDocumentTitle: `YouDescribe - ${TUTORIAL_VIDEO_METADATA.title}`,
  }
}
