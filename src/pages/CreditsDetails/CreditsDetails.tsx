import React from 'react'
import path from 'path-browserify'
import awards from '../../shared/data/awards.json'
import projects from '../../shared/data/projects.json'
import publications from '../../shared/data/publications.json'
import youdescribeHeads from '../../shared/data/youdescribeHeads.json'
import youdescribeMembers from '../../shared/data/youdescribeMembers.json'
import { MemberData } from '@/shared/types/memberData'

const CreditsDetails = () => {
  const getSortedCredits = (): MemberData[] => {
    const heads = JSON.parse(JSON.stringify(youdescribeHeads)) as MemberData[]
    const sortedHeads = heads.sort((a, b) => {
      if (a.year === 'present') {
        a.year = new Date().getFullYear()
      }
      if (b.year === 'present') {
        b.year = new Date().getFullYear()
      }
      return a.year > b.year ? -1 : 1
    })
    const members = JSON.parse(
      JSON.stringify(youdescribeMembers),
    ) as MemberData[]
    const sortedMembers = members.sort((a, b) => {
      if (a.year === 'present') {
        a.year = new Date().getFullYear()
      }
      if (b.year === 'present') {
        b.year = new Date().getFullYear()
      }
      return a.year > b.year ? -1 : 1
    })
    return [...sortedHeads, ...sortedMembers]
  }

  return (
    <div>
      <header role="banner" className="w3-container w3-indigo">
        <h2 className="classic-h2" style={{ textAlign: 'center' }}>
          Credits Page
        </h2>
      </header>
      <div>
        <h1
          className="classic-h1"
          style={{ textAlign: 'center', paddingTop: '20px' }}
        >
          <u>Awards</u>
        </h1>
        <div style={{ marginLeft: '50px', marginRight: '50px' }}>
          <ol>
            {awards.map((award) => (
              <li key={award.headline} style={{ paddingTop: '0px' }}>
                <a
                  href={award.link}
                  target="_blank"
                  className="classic-link"
                  rel="noreferrer"
                >
                  {award.headline}
                </a>
                <p>{award.subtext}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div>
        <h1
          className="classic-h1"
          style={{ textAlign: 'center', paddingTop: '20px' }}
        >
          <u>Masters Project</u>
        </h1>
        <div style={{ marginLeft: '50px', marginRight: '50px' }}>
          {/* <ol >
        {this.state.projects.map((project) =>
          <li key={project.key} style={{paddingTop:"10px"}}>{project.details}</li>
        )}
    </ol> */}
          <ol>
            {projects
              .sort((a, b) => (a.year > b.year ? -1 : 1))
              .map((project) => (
                <li key={project.name}>
                  {project.name},{' '}
                  <a
                    href={path.join(
                      __dirname,
                      'assets',
                      'img',
                      'creditPage',
                      `${project.pdf}`,
                    )}
                    target="_blank"
                    className="classic-link"
                    rel="noreferrer"
                  >
                    <u>“{project.title}”</u>
                  </a>
                  , {project.date}
                </li>
              ))}
          </ol>
        </div>
      </div>
      <div>
        <h1
          style={{ textAlign: 'center', paddingTop: '20px' }}
          className="classic-h1"
        >
          <u>Publications</u>
        </h1>
        <div style={{ marginLeft: '50px', marginRight: '50px' }}>
          <ol>
            {publications.map((publication) => (
              <li key={publication.pub} style={{ paddingTop: '10px' }}>
                {publication.pub}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div>
        <h1
          className="classic-h1"
          style={{ textAlign: 'center', paddingTop: '20px' }}
        >
          <u>Meet the members</u>
        </h1>
        <table className="w3-table">
          <thead>
            <tr className="w3-col">
              <th style={{ width: '200px' }}>Name</th>
              <th style={{ width: '150px' }}>Image</th>
              <th style={{ width: '1000px' }}>Description</th>
            </tr>
          </thead>
          {getSortedCredits().map((person, index) => (
            <div key={index}>
              <tbody className="w3-striped tbody">
                <tr style={{ paddingTop: '10px', height: '200px' }}>
                  <td
                    style={{
                      width: '200px',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}
                  >
                    {person.name}
                    <p>{person.tenure}</p>
                  </td>

                  <td style={{ width: '150px' }} className="w3-card-2">
                    <img
                      alt={person.description}
                      className="w3-image"
                      src={path.join(
                        __dirname,
                        'assets',
                        'img',
                        'creditPage',
                        `${person.img}`,
                      )}
                    />
                  </td>
                  <td style={{ width: '1000px' }}>
                    {person.bio}
                    {person.externalLink ? (
                      <a
                        className="classic-link"
                        target="_blank"
                        href={person.externalLink}
                        rel="noreferrer"
                      >
                        {person.externalLinkTitle}
                      </a>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </div>
          ))}
        </table>
      </div>
    </div>
  )
}

export default CreditsDetails
