import React from 'react'
import './credits.scss'
import headsDetails from '../../shared/data/youdescribeHeads.json'
import membersDetails from '../../shared/data/youdescribeMembers.json'
import MemberCard from '@/features/Credits/MemberCard/MemberCard'
import { Link } from 'react-router-dom'
import Button from '@/shared/components/Button/Button'

const Credits = () => {
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
      <div className="classic-container row justify-content-center">
        {headsDetails.map((head) => (
          <div
            className="col-sm-6 col-md-4 col-lg-3 member-card-column"
            key={head.name}
          >
            <MemberCard
              name={head.name}
              designation={head.designation}
              desc={head.description}
              img={head.img}
              tenure={head.tenure}
            />
          </div>
        ))}
      </div>
      <div className="classic-container row justify-content-center">
        {membersDetails
          .sort((a, b) => {
            if (a.year === 'present') {
              a.year = new Date().getFullYear()
            }
            if (b.year === 'present') {
              b.year = new Date().getFullYear()
            }
            return a.year > b.year ? -1 : 1
          })
          .map((member) => (
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
      <div className="w3-margin-top w3-center load-more">
        <Link to="/credits-details" target="_blank" className="footer-links">
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
