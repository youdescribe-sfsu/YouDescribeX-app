import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './support.scss'

const Viewers = () => {
  useEffect(() => {
    // document.getElementById('support').focus();
  }, [])

  return (
    <div id="support" tabIndex={-1}>
      <header role="banner" className="w3-container w3-indigo">
        <h2>FAQ pages for viewers</h2>
      </header>

      <main className="w3-row">
        <ul className="support-links">
          {/* <li>
            <Link to="/support/system-upgrade-warning">
              <b>Information regarding YouDescribe System Upgrade</b>
            </Link>
          </li> */}
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

        <h2>For Viewers</h2>

        <h3>Anatomy of the YouDescribe welcome page</h3>
        <p>
          Top: A tool bar along the top (from left to right): YouDescribe Home,
          Search Box, Recent Descriptions, Wish List, and the Sign In buttons.
        </p>
        <p>
          Center section: Thumbnail links to recent videos posted with
          YouDescribe audio description (AD).
        </p>
        <p>
          Bottom: Tool bar links to Smith-Kettlewell Eye Research Institute,
          Credits, Contact Us, and Support.
        </p>

        <h3>Q: How can I find YouTube videos that have descriptions?</h3>
        <p>
          A: There are two ways to locate videos! Both require you to visit{' '}
          <a href="www.youdescribe.org">www.youdescribe.org</a>
        </p>
        <p>
          <strong>Search Box:</strong> If you know what video you are seeking,
          type the name/description/key word into the search box in the upper
          tool bar. Click through the search results until you find the one you
          want. Described videos are listed first, then those without AD.
        </p>
        <p>
          <strong>Browse:</strong> Recently described videos are in the center
          section of the homepage, newly posted first. One can load more by
          clicking the Load More button.
        </p>

        <h3>Q: Can I request a description for a particular video?</h3>
        <p>
          A: Yes! YouDescribe keeps a Wish List of videos in need of AD. At{' '}
          <a href="www.youdescribe.org">www.youdescribe.org</a>, use the search
          box (top tool bar, center left). The videos will appear as thumb
          nails. In the left hand corner of each video on the screen is a heart.
          Click the heart to add it to the wish list. Videos with more votes for
          AD are at the top, the latest wish list requests are at the bottom. If
          you want to vote a video to the top of the wish list queue, click the
          icon in the lower left hand corner of the video thumbnail. There is
          not currently a way to add a video to the wish list if it has been
          opened in YouDescribe. Try going back to the search results page with
          the thumbnails, and click the icon in the lower left corner. Not
          finding anything you like? Try clicking the Load More button, bottom
          center of page, to see the next page of Wish List items.
        </p>

        <h3>Q: Can I rewind and fast-forward and stuff like that?</h3>
        <p>
          A: Of course! The YouDescribe player frame includes buttons for Stop,
          Pause/Play, Rewind, and Fast-Forward. A box below and to the right of
          every video allows you to turn off descriptions entirely or select
          from different describers if there is more than one description
          available for the video.
        </p>

        <h3>
          Q: I’m playing the video but the volume of the video and describer is
          all wrong, how do I fix that?
        </h3>
        <p>
          A: There is a slide bar under each video labeled V-- -- -- -- D. Slide
          the bar to the left to have more Video volume, to the right to have
          more Describer volume.
        </p>

        <h3>
          Q: I want someone to add audio description for a video I own, can they
          use YouDescribe?
        </h3>
        <p>
          A: Yes, as long as the video is posted at YouTube. You can create a
          channel of your own to upload the content you want. Directions
          supplied at{' '}
          <a href="https://support.google.com/youtube/answer/1646861?hl=en">
            Google Support - How to create your own YouTube channel
          </a>
          .
        </p>

        <h3>Q: How can I send feedback or reach technical support?</h3>
        <p>
          A: Please email us at:{' '}
          <a href="mailto: info@youdescribe.org">info@youdescribe.org</a>
        </p>
      </main>
    </div>
  )
}

export default Viewers
