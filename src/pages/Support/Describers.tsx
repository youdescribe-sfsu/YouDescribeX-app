import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './support.scss'

const Describers = () => {
  useEffect(() => {
    // document.getElementById('support').focus();
  }, [])

  return (
    <div id="support" tabIndex={-1}>
      <header role="banner" className="w3-container w3-indigo">
        <h2>FAQ for describers</h2>
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

        <h2>For Describers</h2>

        <p>
          By popular demand - the describer troubleshooting checklist! Having
          trouble saving your tracks? Before you panic - use this handy, dandy
          checklist.
        </p>

        <p>
          <strong>1.</strong> You need to be on a desktop (not an ipad or
          iphone) with fast internet (shared internet at a coffee shop etc. is
          generally over-subscribed).
        </p>

        <p>
          <strong>2.</strong> Check that your mic is not intermittent (loose
          wire, or connection). There are several programs that will check your
          microphone. You can use your favorite or{' '}
          <a href="https://mictests.com/">https://mictests.com/</a> is
          available. The fancier your microphone and recording, the more
          settings your desktop/laptop will need customized.
        </p>

        <p>
          <strong>3.</strong> Start fresh! If you have been logged in for a
          while, log out of all google accounts including YouTube, clear your
          cache, then log back in. This will make sure the version of
          YouDescribe you are working in is the latest version! When in doubt:
          closing your whole computer system (power it down) and starting with a
          fresh browser window is the fastest way.
        </p>

        <p>
          If in doubt, go to an incognito window, and make your descriptions
          from there. Then you can side step all the logging out, shutting down
          and signing back in. Not familiar with incognito? An overview is
          provided at{' '}
          <a href="https://www.indeed.com/career-advice/career-development/how-to-open-incognito-tab">
            Incognito
          </a>
        </p>

        <p>
          <strong>4.</strong> Make short tracks, around one minute or less is
          optimal, anything over two is problematic when viewers want to fast
          forward or rewind. By the same token, tracks shorter than 30 seconds
          can be hard for our API to play consistently. If it is frequently
          dropped, it’s probably a little too short, or too long.
        </p>

        <p>
          <strong>5.</strong> Make sure your tracks are not overlapping or
          neither of them will play. Use the timeline bar, and the track times
          to nudge them into a better spot.
        </p>

        <p>
          <strong>6.</strong> Don&apos;t &quot;spot-check&quot; your tracks by
          skipping around, in general your recorded tracks are there, but the
          API can&apos;t keep up the synchronized play with rapid changes.
        </p>

        <p>
          <strong>7.</strong> Volume trouble? Are you using some fancy recording
          equipment and programs? Sometimes the settings on your computer and in
          the program you are using need adjustment and it’s not enough to just
          check if your microphone is working. You will now need to check your
          computer audio input and output settings, and then again for the
          program you are using, and then check the levels at YouDescribe.
        </p>

        <p>
          Many frequently asked questions are answered in our description
          tutorial playlist. Go to our{' '}
          <a href="https://www.youtube.com/playlist?list=PLNJrbI_nyy9uzywoJfyDRoeKA1SaIEFJ7">
            Audio Description Tutorial Playlist
          </a>
        </p>

        <h3>
          Q: Do I need any kind of training or certification to be a YouDescribe
          describer?
        </h3>
        <p>
          A: No, but the more you know about good audio description, the better
          and more useful your descriptions will be. Go to YouDescribe Tutorial
          Playlists to learn the{' '}
          <a href="https://www.youtube.com/playlist?list=PLNJrbI_nyy9uzywoJfyDRoeKA1SaIEFJ7">
            basics of good AD
          </a>
          , more{' '}
          <a href="https://www.youtube.com/playlist?list=PLNJrbI_nyy9sjqZ-Wcn6sX868i9KtdNrT">
            about YouDescribe
          </a>
          , and our current interface video tutorials. Our YouDescribe specific
          style guide can be read here:{' '}
          <a href="https://skeri-my.sharepoint.com/:w:/g/personal/cpcooper_ski_org/IQDP3nh0staSSImMfEZ-CB3iAbQkgEXQphjuXPaHgOkHntc?e=n5Pnig">
            YD StyleGuide
          </a>
        </p>

        <h3>Q: How do I describe a video with YouDescribe?</h3>
        <p>
          A: To contribute descriptions to YouDescribe, you first need to be a
          registered user. Log in to your account using a Google ID (you must
          have a google ID to rate and add descriptions. If you don’t have a
          Google ID, an account is free and easy to get at{' '}
          <a href="https://accounts.google.com/SignUp?hl=en">
            Google Accounts page
          </a>
          . Many of our users create a google ID just for their audio
          description work. Please keep in mind that your google ID will be
          visible and searchable at YouDescribe.org. If you have any online
          safety concerns feel free to use a pseudonym. At YouDescribe you will
          be prompted to type in your google address, and password. Once you
          have logged in, you are ready to start rating videos, and doing audio
          description (AD).
        </p>

        <h3>Q: What equipment do I need to use YouDescribe?</h3>
        <p>
          A: To record descriptions for YouDescribe you only need an Internet
          connection, a browser that supports YouDescribe (Chrome and Firefox
          are the most consistent) and a microphone. Many computers have
          built-in microphones, but it’s best to use an external microphone to
          minimize room noise and get the best voice quality.
        </p>

        <h3>Q: What kind of microphone works best with YouDescribe?</h3>
        <p>
          A: We’ve had the best results with USB headset microphones such as
          those used for Skype, gaming, or other voice applications. These
          headsets are inexpensive and easy to use. Of course, you can use
          fancier microphones as well, but these simple USB headset mics work
          great. As recording has gotten more common, and technology has
          advanced, your computer microphone has also gotten better at filtering
          out noise. If your recording is echoing, a microphone with a
          popfilter, and some acoustic panels, or even a few blankets can help.
        </p>

        <h3>Q: What videos should I describe?</h3>
        <p>
          A: It depends. The most important things to describe are the things
          that people need. Let your blind students, friends, and family members
          be the guides. YouDescribe keeps a wish list of videos in need of AD.
          To find something on the wishlist, click the Wishlist button at the
          top tool bar, it has a heart next to it. Now you are on the main
          Wishlist page. There are three sections: Recent AI Descriptions (those
          videos that have been prompted but a volunteer has not yet corrected),
          My Wishlist (videos that you have requested, but are not yet
          described) and the sitewide Wishlist (You can refine the list by
          sorting by category, or by keyword search. Videos with more votes for
          AD are at the top, then they are sorted by latest request). Selecting
          the Describe button will open that video, and then you can select from
          add to Wishlist, Add freestyle Description, and Request AI
          Descriptions.
        </p>
        <p>
          Videos with more votes for AD are at the top, then the most recent
          requests. Select a video to describe from the wish list by clicking
          the Describe button. Don’t see anything you like? Use the category and
          search bars to find something you like.
        </p>
        <p>
          We have a new page just for videos that have an AI prompted Draft
          available that has not yet been corrected. A draft that needs
          correcting can help you get started! The AI Draft page can be found by
          accessing the toolbar at the top of the homepage- tab or click through
          to AI Draft, and then select. Like the Wishlist page, the AI Draft
          page has its own search bar, you can browse by selecting the
          thumbnails, OR use the search to find an AI draft to correct.
        </p>

        <h3>Q: What kinds of things should I describe in a video?</h3>
        <ul>
          <li>Describe what you see.</li>
          <li>Be concise and speak comfortably but quickly.</li>
          <li>Always read on-screen text exactly as they appear.</li>
          <li>Be factual.</li>
          <li>Use proper terminology and names whenever possible.</li>
          <li>Write a script.</li>
          <li>Use inline description when possible, extended when necessary</li>
          <li>Try to match the mood of the video.</li>
        </ul>

        <h3>Q: What kinds of things should I not describe?</h3>
        <ul>
          <li>Don’t talk over the dialog.</li>
          <li>Don’t describe what can be inferred from the audio.</li>
          <li>Don’t over-describe - less is more.</li>
          <li>Don’t interpret or editorialize.</li>
          <li>
            Don’t give away secrets, surprises, or sight gags before they
            happen.
          </li>
          <li>Don’t censor (sex, violence, gore, emotions).</li>
          <li>Don’t overuse extended description.</li>
          <li>
            Do not describe obvious sound cues such as a phone ringing or a dog
            barking.
          </li>
        </ul>

        <h3>
          Q: Is there an audio description style guide specifically for
          YouDescribe?
        </h3>
        <p>
          A: At long last, we do have a style guide!{' '}
          <a href="https://skeri-my.sharepoint.com/:w:/g/personal/cpcooper_ski_org/IQDP3nh0staSSImMfEZ-CB3iAbQkgEXQphjuXPaHgOkHntc?e=n5Pnig">
            YouDescribe Style Guide
          </a>
        </p>
      </main>
    </div>
  )
}

export default Describers
