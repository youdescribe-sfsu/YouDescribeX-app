import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './support.scss'

const Tutorial = () => {
  useEffect(() => {
    // document.getElementById('support').focus();
  }, [])

  return (
    <div id="support" tabIndex={-1}>
      <header role="banner" className="w3-container w3-indigo">
        <h2>
          A step-by-step audio description tutorial with a trouble shooting
          section
        </h2>
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
        <h2>
          YouDescribe Audio Description (AD) Tool Step By Step Instructions
        </h2>

        <h3>Anatomy of the YouDescribe welcome page.</h3>

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
          Credits, Contact Us, and Support
        </p>

        <p>
          <strong>Getting Started!</strong>
        </p>

        <h3>Logging in:</h3>
        <p>
          Log in to your account using your Google ID at the top right by
          clicking the box that says “Signin with Google.” (you must have a
          google ID to add descriptions, if you don’t have one, an account is
          free and easy to get at:{' '}
          <a href="https://accounts.google.com/SignUp?hl=en">
            https://accounts.google.com/SignUp?hl=en
          </a>
          ) You will be prompted to type in your google address, and password.
          Once you have logged in, you are ready to start describing, and will
          be able to save your work.
        </p>

        <h3>Finding your desired YouTube Video:</h3>

        <p>
          <strong>There are two ways to locate videos!</strong>
        </p>

        <p>
          <strong>Search Box</strong>: If you know what video you are seeking,
          type the name/description/channel into the search box in the upper
          tool box, center-left of page. The video must be up at YouTube for you
          to add description. (If it has not been shared at YouTube, you can
          create a channel of your own to upload the content you want.
          Directions supplied{' '}
          <a href="https://support.google.com/youtube/answer/1646861?hl=en">
            here
          </a>
          . Click through the search results until you find the one you want.
          Sometimes there are multiple copies of the video- pick the best
          quality and most official one. For example- a Sesame Street video in
          HD posted by PBS will be of better quality and most likely be at
          YouTube longer than one who filmed from the TV screen, and loaded to
          an obscure YouTube Channel. Click the thumbnail to open a new window
          and start adding AD.
        </p>

        <p>
          <strong>Wish List</strong>: YouDescribe keeps a wish list of videos in
          need of AD. To find something on the wish list, click the Wish List
          button at the top tool bar, it has a heart next to it. Now you are on
          the main Wish List page. Videos with more votes for AD are at the top,
          the latest wish list requests are at the bottom. Select a video to
          describe from the wish list by clicking the Describe button in the
          lower right hand corner of the video thumbnail. If you want to vote a
          video to the top of the wish list queue, click the heart in the lower
          left hand corner of the video thumbnail. Don’t see anything you like?
          Try clicking the Load More button, bottom center of page, to see the
          next page of wish list items. Click the thumbnail to select the video
          and start adding AD.
        </p>

        <h3>Adding something to the wish list:</h3>
        <p>
          At YouDescribe, use the search box. The videos will appear as thumb
          nails. In the left hand corner of each video on the screen is a heart.
          Click the heart to add it to the wish list. There is not currently a
          way to add a video to the wish list if it has been opened in
          YouDescribe. Try going back to the search results page with the
          thumbnails, and click the heart icon in the lower left corner.
        </p>

        <h3>Add Audio Description (AD) to your Video:</h3>
        <p>
          The Video you want to describe should be in the center of the page. If
          the video does not already have AD, there will be Add Description
          button under the video screen and to the right. Click there to add
          your description. (If that video has AD you have two other buttons
          available as well-rate Description, and Turn off descriptions. Rate
          description allows you to rate the describer on that particular video.
          Turn Off descriptions allows you to stop the AD while you view the
          video. Videos may have multiple descriptions available). To begin -
          select Add Description. You can add description to any video- even if
          it has already been described.
        </p>

        <h3>Anatomy of the YouDescribe AD tools.</h3>
        <p>
          The video is in the upper left corner with standard YouTube play pause
          buttons. Stop/start is controlled by the standard YouTube tool bar on
          the video in the left hand corner. On the right is a section labeled
          Notes. Under the video is a long tool bar. At the far left of the tool
          bar are two buttons, a yellow Add Inline button, and a magenta Add
          extended. Inline is an audio track that plays over the video, it needs
          to be timed so as not to disrupt the dialog, and original audio.
          Extended description stops the video while the AD is played. Even with
          extended description, it is best to say only as much as it strictly
          necessary so the viewer can get back to watching the video. You will
          need to be familiar with both the YouTube play/pause buttons, as well
          as the YouDescribe tool bars.
        </p>

        <h3>Make an anchor track:</h3>
        <p>
          To begin, we recommend you record an anchor track. YouDescribe works
          best if you record a short extended or inline audio track before you
          proceed to other steps. Often it is the title shown on the screen, or
          a brief description of the setting.
        </p>

        <p>
          Click the Add extended, a space will appear so you can label your
          first track. Pick something brief but descriptive for each track
          title, it makes finding the tracks, and editing easier later. Under
          the label box there are two symbols- a red record button, and a trash
          can. Mouse up to the controls on the video, and press play. Get the
          curser ready to click the red record button under the Extended audio
          track you have set up. When you want to record your first track, click
          the red record button. Once you have clicked the red button, it will
          be replaced with a white square. This is now the stop recording
          button. Click the white square when you are done speaking. Use the
          control buttons on the video to back up and hear your first track. If
          you are happy with it, press the save button. To delete a recorded
          track, click the trash can button. Now you can re-record your anchor
          track. Once you are happy with it, press save. It is best practice not
          to delete your anchor track once you are satisfied.
        </p>

        <h3>Deleting a track:</h3>
        <p>
          Click the trashcan symbol under the track. Easy! A note of caution,
          once deleted one cannot bring the track back.
        </p>

        <h3>Using the Notes section:</h3>
        <p>
          Now watch the entire video and make your notes for each track in the
          section to the right of the video. Be brief, be descriptive. Please
          read anything printed. A full tutorial on good audio description can
          be found{' '}
          <a href="https://www.youtube.com/watch?v=24Pmmo9wKik&amplist=PLNJrbI_nyy9uzywoJfyDRoeKA1SaIEFJ7">
            here
          </a>
          . Once you have all your notes written start recording! Pick either
          inline or extended, and follow the steps above.
        </p>

        <h3>Saving your work:</h3>
        <p>
          Save your work often. The save button is on the right hand side,
          towards the bottom of the audio tracks. Click that save button before
          you delete anything, or refresh the video.
        </p>

        <h3>Tool bar for recorded tracks:</h3>
        <p>
          Under each recorded audio track is a tool bar with 5 functions: a
          start/stop button (shown as play/pause), a switch between inline and
          extended track (shown as the Rightwards Arrow Over Leftwards Arrow),
          left arrow (move the audio track a little earlier), right arrow (move
          the audio track a little later) and a delete button (classic trash
          can).
        </p>

        <p>
          <strong>Editing</strong>:
        </p>

        <h3>Converting Inline/Extended:</h3>
        <p>
          You can use a mix of inline and extended audio tracks, and they can be
          converted from Extended to Inline using the rightwards arrow over
          leftwards arrow under each track.
        </p>

        <h3>Using the Nudge feature:</h3>
        <p>
          To move the track half a second sooner, click the left arrow button,
          to move it half a second later click the right arrow button. You can
          click it as many times as you need to get it to settle in exactly the
          right spot. Play the video to hear if it is just right by using the
          control panel located on the video (the regular YouTube controls),
          then save your work by pressing the save button in the lower right
          corner. Save your work often.
        </p>

        <p>
          <strong>Troubleshooting your recordings:</strong>
        </p>

        <h3>Q: I am playing the video back, but my audio is not playing.</h3>
        <p>
          A: First of all, make sure that your mic is turned on, your computer’s
          mic settings are un-muted, and the mic volume is turned up. You can
          test you mic using a number of online programs.{' '}
          <a href="https://www.onlinemictest.com/">Here is one</a>. YouTube and
          YouDescribe are sometimes misaligned and the tracks play out of sync,
          especially if you have used the delete, nudge, or inline/extended edit
          tools. They are usually still there! Save your work by pressing the
          save button, then refresh the page - your tracks should now play. If
          you are on a very slow connection, or are running a lot of programs
          sometimes there is a lag in processing and saving your tracks. One
          thing that can help is shutting down any unneeded applications,
          getting to a better internet or waiting a few more seconds after
          pressing save before moving onto the next task.
        </p>

        <h3>
          Q: My audio track is just a little off, is there anything I can do?
        </h3>
        <p>
          A: This is where the nudge feature is your friend. Click the left or
          right arrows to move it 0.15 seconds sooner or later.
        </p>

        <h3>
          Q: What is the difference between inline description and extended
          description again?
        </h3>
        <p>
          A: Most description that has been created over the last few decades is
          Inline description. This means that the description is carefully
          dubbed into available spaces in the existing soundtrack. This
          sometimes left very little space for a describer to say anything,
          leading to extremely hard choices about what they could describe. With
          streaming video available on demand, it is no longer necessary to
          restrict the available time for description. Extended description
          automatically pauses the video to give the describer as much time as
          necessary to tell the blind viewer what is going on. Of course, even
          with extended description, it is best to say only as much as it
          strictly necessary so you can get back to watching the video.
        </p>

        <h3>
          Q: I recorded an inline track but it is too long and is getting in the
          way of the dialog. Help!
        </h3>
        <p>
          A: Try converting it to extended using the double arrow button under
          the track, then the video will stop so you can get your script in
          there. If it is too long, you might want to delete it and re-record
          another one with a shorter description.
        </p>

        <h3>
          Q: I made a lot of extended tracks an now the video is super long, and
          boring.
        </h3>
        <p>
          A: It happens to the best of us. We want to be thorough and get
          everything in there! Chances are the video is a little over described.
          Try cutting down your script, and re-recording a few tracks.
        </p>

        <h3>Q: I missed a section I needed to describe, how do I fix it?</h3>
        <p>
          A: Save your work, then refresh the video so you can play it from the
          beginning. At the bottom, label the track you want to record. Advance
          the video until you are in the right spot and click the red dot to
          start recording, click the white square when you are finished
          speaking. The tag for the track will not be in play order, but it will
          play in the correct spot on the video.
        </p>

        <h3>Q: How long will my content be saved on YouDescribe?</h3>
        <p>
          A: Your descriptions will be stored on YouDescribe until you delete
          them.
        </p>

        <h3>Q: Can I download my descriptions for my own use off-line?</h3>
        <p>
          A: This feature is not currently available, but stay tuned for
          possible developments in this area.
        </p>

        <h3>Q: Can I edit descriptions recorded by other users?</h3>
        <p>
          A: No, (and they can’t edit yours either). However, you can record a
          new description of your own for that video. Then users will have
          access to both descriptions and can choose which one they want.
        </p>

        <h3>Q: How long will my content be saved on YouDescribe?</h3>
        <p>
          A: Your descriptions will be stored on YouDescribe until you delete
          them.
        </p>

        <h3>Q: How can I send feedback or reach technical support?</h3>
        <p>
          A: Please email us at:{' '}
          <a href="mailto: info@youdescribe.org">info@youdescribe.org</a> or
          join our online community at{' '}
          <a href="https://www.facebook.com/youdescribe/">Facebook</a>.
        </p>
      </main>
    </div>
  )
}

export default Tutorial
