import React from 'react'
import './credits.scss'
import headsDetails from '../../shared/data/youdescribeHeads.json'
import membersDetails from '../../shared/data/youdescribeMembers.json'
import MemberCard from '@/features/Credits/MemberCard/MemberCard'
import { Link } from 'react-router-dom'
import Button from '@/shared/components/Button/Button'

const Credits = () => {
  // Categorize team members
  const leadership = headsDetails.filter(head => 
    head.designation.toLowerCase().includes('creator') || 
    head.designation.toLowerCase().includes('product manager') ||
    head.designation.toLowerCase().includes('machine learning & youdescribex') ||
    head.designation.toLowerCase().includes('research & user study design') ||
    head.name.toLowerCase().includes('leme de mello')
  );

  const currentTeam = membersDetails.filter(member => 
    member.year === 'present' || 
    (typeof member.year === 'number' && member.year >= 2024)
  );

  const alumni = membersDetails.filter(member => 
    member.year !== 'present' && 
    (typeof member.year === 'number' && member.year < 2024)
  ).sort((a, b) => {
    const yearA = typeof a.year === 'number' ? a.year : 0;
    const yearB = typeof b.year === 'number' ? b.year : 0;
    return yearB - yearA; // Sort by most recent first
  });

  // Add leadership members who are not currently active to alumni
  const inactiveLeadership = headsDetails.filter(head => 
    !leadership.includes(head) && 
    head.year !== 'present' && 
    (typeof head.year === 'number' && head.year < 2024)
  );
  
  alumni.push(...inactiveLeadership);

  return (
    <div id="credits">
      <header role="banner" className="w3-container w3-indigo">
        <h2 className="classic-h2" style={{ textAlign: 'center' }}>
          Credits
        </h2>
      </header>
      
      <div id="Meet the team">
        <h1 className="classic-h1" style={{ textAlign: 'center' }}>
          Meet the creative minds behind YouDescribe
        </h1>
      </div>

      {/* Leadership Section */}
      <div className="team-section">
        <h2 className="section-title">Leadership</h2>
        <div className="classic-container row justify-content-center">
          {leadership.map((leader) => (
            <div
              className="col-sm-6 col-md-4 col-lg-3 member-card-column"
              key={leader.name}
            >
              <MemberCard
                name={leader.name}
                designation={leader.designation}
                desc={leader.description}
                img={leader.img}
                tenure={leader.tenure}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Current Team Section */}
      <div className="team-section">
        <h2 className="section-title">Current Team</h2>
        <div className="classic-container row justify-content-center">
          {currentTeam.map((member) => (
            <div
              className="col-sm-6 col-md-4 col-lg-3 member-card-column"
              key={member.name}
            >
              <MemberCard
                name={member.name}
                designation={member.designation}
                desc={member.description}
                img={member.img}
                tenure={member.tenure}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Alumni Section */}
      <div className="team-section">
        <h2 className="section-title">Alumni</h2>
        <div className="classic-container row justify-content-center">
          {alumni.map((member) => (
            <div
              className="col-sm-6 col-md-4 col-lg-3 member-card-column"
              key={member.name}
            >
              <MemberCard
                name={member.name}
                designation={member.designation}
                desc={member.description}
                img={member.img}
                tenure={member.tenure}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="w3-margin-top w3-center load-more">
        <Link to="/credits-details" target="_self" className="footer-links">
          <Button
            id="know-more"
            color="w3-indigo"
            ariaLabel="Know More"
            text={'Know More'}
          />
        </Link>
      </div>
    </div>
  )
}

export default Credits
