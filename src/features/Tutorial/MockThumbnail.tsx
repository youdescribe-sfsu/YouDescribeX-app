import type { CSSProperties } from 'react'

interface MockThumbnailProps {
  thumbnailUrl: string
  alt: string
  width: number | string
  height: number | string
  iconSize: number
  overlayTextColor: string
  minHeight?: number
}

const IMAGE_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const PLAY_ICON_STYLE: CSSProperties = {
  position: 'absolute',
  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
}

const MockThumbnail = ({
  thumbnailUrl,
  alt,
  width,
  height,
  iconSize,
  overlayTextColor,
  minHeight,
}: MockThumbnailProps) => {
  const containerStyle: CSSProperties = {
    width,
    height,
    minHeight,
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: overlayTextColor,
    overflow: 'hidden',
    position: 'relative',
  }

  const playIconStyle: CSSProperties = {
    ...PLAY_ICON_STYLE,
    fontSize: iconSize,
  }

  return (
    <div className="rounded" style={containerStyle}>
      <img src={thumbnailUrl} alt={alt} style={IMAGE_STYLE} />
      <i className="fa fa-play-circle" style={playIconStyle} />
    </div>
  )
}

export default MockThumbnail
