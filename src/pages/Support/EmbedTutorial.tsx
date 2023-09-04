import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './support.scss'

const EmbedTutorial = () => {
  useEffect(() => {
    // document.getElementById('support').focus();
  }, [])

  return (
    <div id="support" tabIndex={-1}>
      <header role="banner" className="w3-container w3-indigo">
        <h2>A step-by-step embedding tutorial</h2>
      </header>

      <main className="w3-row">
        <ul className="support-links">
          <li>
            <Link to="/support/about">
              General information about YouDescribe
            </Link>
          </li>
          <li>
            <Link to="/support/viewers">FAQ pages for viewers</Link>
          </li>
          <li>
            <Link to="/support/describers">FAQ for describers</Link>
          </li>
          <li>
            <Link to="/support/tutorial">
              A step-by-step audio description tutorial with a trouble shooting
              section
            </Link>
          </li>
          <li>
            <Link to="/support/embed_tutorial">
              A step-by-step embedding tutorial
            </Link>
          </li>
          <li>
            <Link to="/support/privacy">Privacy Policy</Link>
          </li>
        </ul>

        <h2>YouDescribe How to Embed Step By Step Instructions</h2>

        <h3>Anatomy of the YouDescribe selected video page.</h3>

        <p>
          Top: A tool bar along the top (from left to right): YouDescribe Home,
          Search Box, Recent Descriptions, Wish List, and the Sign In buttons.
        </p>
        <p>
          Left section: Left side links to social media like Facebook, Twitter,
          Email. Also, the two buttons below it links to the embedded link and
          html snippet.
        </p>
        <p>
          Center section: Thumbnail links to the selected video and below it
          there are two sections. One has the title of the video, views, date
          published and votes. The other section has options to rate
          description, turn off descriptions or add a new description.{' '}
        </p>
        <p>
          Bottom: Tool bar links to Smith-Kettlewell Eye Research Institute,
          Credits, Contact Us, and Support
        </p>

        <p>
          <strong>Getting Started!</strong>
        </p>
        <p>
          In the following video tutorial, you will learn how to embed content
          step by step:
        </p>
        <video width="700" height="500" controls>
          <source src="/embed_tutorial.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </main>
    </div>
  )
}

export default EmbedTutorial
