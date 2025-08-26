import React from 'react'
import './teamStats.scss'

interface TeamStatsProps {
  totalMembers: number
  currentMembers: number
  alumniCount: number
  leadershipCount: number
}

const TeamStats: React.FC<TeamStatsProps> = ({
  totalMembers,
  currentMembers,
  alumniCount,
  leadershipCount,
}) => {
  return (
    <div className="team-stats">
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number">{totalMembers}</div>
          <div className="stat-label">Total Team Members</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{currentMembers}</div>
          <div className="stat-label">Current Team</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{alumniCount}</div>
          <div className="stat-label">Alumni</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{leadershipCount}</div>
          <div className="stat-label">Leadership</div>
        </div>
      </div>
    </div>
  )
}

export default TeamStats
