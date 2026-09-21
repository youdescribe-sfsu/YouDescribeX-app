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
          Search Box, History (this works if you are signed in), Wishlist, AI
          Draft, Support, and the Sign In buttons.
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
          <a href="https://youdescribe.org">www.youdescribe.org</a>
        </p>
        <p>
          <strong>Search Box:</strong> If you know what video you are seeking,
          type the YouTube ID/ describer name/video title/keyword into the
          search box in the upper toolbar. Click through the search results
          until you find the one you want. Described videos are listed first, to
          access undescribed videos, press the Search YouTube button. The most
          direct way to search at YouDescribe is to put the YouTube video ID
          into the search bar. The video ID is located in the URL of the video
          page, right after the V= URL parameter.
        </p>
        <p>
          <strong>Browse:</strong> Recently described videos are in the center
          section of the homepage, newly posted first. One can load more by
          clicking the Load More button.
        </p>

        <h3>Q: Can I request a description for a particular video?</h3>
        <p>
          A: Yes! YouDescribe keeps a Wish List of videos in need of AD. To add
          something to the wishlist at{' '}
          <a href="https://youdescribe.org">www.youdescribe.org</a>, use the
          search box (top tool bar, center left). The videos will appear as
          thumbnails. In the left hand corner of each video on the screen is a
          heart. Click the heart to add it to the wish list.
        </p>
        <p>
          If Chrome is your browser, it is even easier! We have a Chrome
          Wishlist Extension you can download. The link to download the
          extension is on your profile tab at the far right on the top tool bar
          on the home page. Select Profile to open the menu. Tab down to
          Extension and select. Once added, when you are at YouTube, you can
          click the YouDescribe Extension button at the Top header/NavBar, (its
          next to the URL address and search bar) and the video will
          automatically be added to the very top of the My Wishlist page.
        </p>
        <p>
          You can also go to the Wishlist page (top tool bar, right side,
          between History and AI Drafts) and add your votes to items that have
          already been nominated. Selecting the Describe button will open that
          video, and then you can add it to the wishlist using the button under
          the player.
        </p>

        <h3>Q: Can I rewind and fast-forward and stuff like that?</h3>
        <p>
          A: Of course! The YouDescribe player frame includes buttons for Stop,
          Pause/Play, Rewind, and Fast-Forward, and all of the standard YouTube
          Keyboard shortcuts function as well. A box below and to the right of
          every video allows you to turn off descriptions entirely or select
          from different describers if there is more than one description
          available for the video.
        </p>

        <h3>
          Q: I’m playing the video but the volume of the video and describer is
          all wrong, how do I fix that?
        </h3>
        <p>
          A: We have an expanded feature for video ducking (just a fancy term
          for balancing the describer volume and the video volume). There are
          two slide bars under each video. To adjust the volume you can use
          right and left arrow keys, a mouse, or a touch screen. The first
          slider is for the describer volume, to increase the volume slide the
          right, to decrease slide it left. Below that bar is the video volume,
          You can make it louder by sliding the bar right, and softer sliding
          the bar left. Please note: there is sometimes a little bit of a lag in
          the volume correction.
        </p>

        <h3>
          Q: The video I selected has multiple descriptions; How do I change the
          describer?
        </h3>
        <p>
          A: Tab down until you reach the first describers name, if you are
          logged in under the name are three buttons: rate description, optional
          feedback, and turn off description. Tab down to the next describer
          name. There is no limit to the number of people who can describe a
          video. If you love a particular describer, you can search for just the
          videos they have done in the search bar at the top of the welcome
          page.
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
