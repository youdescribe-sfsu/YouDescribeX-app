import React from 'react'
import path from 'path-browserify'
import './memberCard.scss'

interface Props {
  name: string
  designation: string
  tenure: string
  img: string
  desc: string
}

const MemberCard = ({ name, designation, tenure, img, desc }: Props) => {
  return (
    <div id="video-card" className="w3-margin-top w3-left member-card" title="">
      <div className="w3-card-2 w3-hover-shadow member-card-inner">
        <div id="card-thumbnail" aria-hidden="true">
          <img
            alt={desc}
            src={path.join(__dirname, 'assets', 'img', 'creditPage', `${img}`)}
            className="classic-img"
            style={{
              width: '100%',
              height: 'auto',
            }}
          />
        </div>
        <br></br>
        <div className="w3-container w3-padding-bottom member-text">
          <div id="card-title-container">
            <div id="card-title">
              <h2 className="classic-h2">{name}</h2>
            </div>
            <div id="card-bio">
              <span
                style={{
                  background: 'white',
                }}
              >
                {designation}&nbsp;
              </span>
              <br />
              <span
                style={{
                  background: 'white',
                }}
              >
                {tenure}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberCard
