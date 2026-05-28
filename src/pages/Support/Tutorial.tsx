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
          Search Box, History, Wishlist, Support and the Sign In buttons.
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
          clicking the box that says “Sign In with Google.” (you must have a
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
          the most direct way to access that video is to type in the YouTube ID,
          as a secondary search you can type the title, a keyword, or the
          channel owner name into the search box in the upper tool box,
          center-left of page. For you to create a description the video must be
          set to public at YouTube and be allowed under our API key. We are only
          able to access content that is acceptable for children 13 and under.
          (If it has not been shared at YouTube, you can create a channel of
          your own to upload the content you want. Directions supplied{' '}
          <a href="https://support.google.com/youtube/answer/1646861?hl=en">
            here
          </a>
          .) Click through the search results until you find the one you want.
          Sometimes there are multiple copies of the video- pick the best
          quality and most official one. For example- a Sesame Street video in
          HD posted by PBS will be of better quality and most likely be at
          YouTube longer than one who filmed from the TV screen, and loaded to
          an obscure YouTube Channel. Click the thumbnail to open a new window
          and start adding AD.
        </p>

        <p>
          <strong>Wishlist</strong>: YouDescribe keeps a wish list of videos in
          need of AD. It is best audio description practice to create AD for
          videos on our Wishlist. To find something on the wishlist, click the
          Wishlist button at the top toolbar, it has a heart next to it. Now you
          are on the main Wishlist page. There are three sections: Recent AI
          Descriptions (those videos that have been prompted but a volunteer has
          not yet corrected), My Wishlist (videos that you have requested, but
          are not yet described) and the sitewide Wishlist (You can refine the
          list by sorting by category, or by keyword search. Videos with more
          votes for AD are at the top, then they are sorted by latest request).
          Selecting the Describe button will open that video, and then you can
          select from add to Wishlist, Add freestyle Description, and Request AI
          Descriptions.
        </p>

        <p>
          Videos with more votes for AD are at the top, then the most recent
          requests. Select a video to describe from the wish list by clicking
          the Describe button. Overwhelmed or don’t see anything you like? Use
          the category and search bars above the list to find something you
          like.
        </p>

        <h3>Adding something to the wish list:</h3>
        <p>
          At the YouDescribe homepage, use the search box on the top tool bar.
          The videos will appear as thumbnails. In the left hand corner of each
          video on the screen is a heart. Click the heart to add it to the wish
          list. Or you can open the video to full screen and select the first
          button in the tool stack on the right, “add to wishlist.”
        </p>

        <h3>Add Audio Description (AD) to your Video:</h3>
        <p>
          The video you want to describe should be in the center of the page. If
          the video does not already have AD, there will be an Add Freestyle
          Description button and a Request AI Button under the video screen and
          to the right. Click there to add your description. (If that video has
          AD you have two other buttons available as well: Rate Description, and
          Turn Off Descriptions. Rate Description allows you to rate the
          describer on that particular video. Turn Off descriptions allows you
          to stop the AD while you view the video. Videos may have multiple
          descriptions available). To begin - select Add FreeStyle Description.
          You can add description to any video- even if it has already been
          described.
        </p>

        <h3>Choosing your audio description interface:</h3>
        <p>
          There are two different ways to create an audio description with
          YouDescribe: The Freestyle interface and the AI Prompted interface.
          The basic layout of both interfaces is similar.
        </p>

        <h3>Anatomy of the YouDescribe AD tools.</h3>
        <p>
          The video viewer is in the upper left corner. Stop/start is controlled
          by a play/pause button in the top center of the page.
        </p>
        <p>
          In the center of the screen is a green start/pause button that you
          will use to control the video viewer, and a two part control system to
          set the volume level of the video, as well as the volume level for
          your description. To adjust the volume you can use right and left
          arrow keys, a mouse, or a touch screen. The first slider is for the
          describer volume, to increase the volume slide the right, to decrease
          slide it left. Below that bar is the video volume, You can make it
          louder by sliding the bar right, and softer sliding the bar left.
          Please note: there is sometimes a little bit of a lag in the volume
          correction.
        </p>
        <p>
          On the far right is a section labeled Notes. Use the notes section for
          anything you want to write down. Here you can jot anything down that
          comes to mind. Language you would like to use. Details you would like
          to include. To help you keep track of your ideas, the notes section
          automatically saves and assigns a time-stamp for where you are stopped
          in the video. This can be helpful for faster track placement later.
        </p>

        <h3>Timeline tool bar:</h3>
        <p>
          The timeline toolbar displays your track controls and shows where they
          are placed within the video. It uses color coding to help you see and
          understand the position of each track. The red slider bar on the
          timeline—sometimes called the storyline bar—lets you start or replay
          the video from any specific time stamp. It also functions like a
          timing marker: wherever the red bar is positioned becomes the starting
          point for any edits you make.
        </p>
        <p>
          <strong>Please Note:</strong> You can navigate the Timeline tool bar
          without using a mouse by using the CLIP INDEX button. Tab
          down to CLIP INDEX, select, and then tab down to the track
          you want to work on. The red timeline bar will automatically move to
          that spot in the video.
        </p>
        <p>
          When you need to move or adjust an audio track, check where the red
          bar is located and place it just before the point where you want the
          track to begin. This ensures that your edits land exactly where you
          intend. If you drag the red bar a long distance on the timeline, you
          may notice a brief delay. Pausing for a moment gives the video time to
          catch up.
        </p>
        <p>
          If you reach the end of the video and want to return to the very
          beginning, it is usually faster and more reliable to refresh the
          browser window. This resets the timeline and brings you back to the
          start.
        </p>

        <h3>Add Inline/Add Extended:</h3>
        <p>
          There are two buttons for the two types of audio description tracks:
          YELLOW Inline and FUSCHIA Extended style. An Inline track plays while
          the video plays; For an extended track the video is stopped while the
          track plays.
        </p>
        <p>
          It is good audio description practice to use inline whenever possible,
          and extended only when necessary. This means at the end of your
          description you will have a lot of inline tracks, and very few
          extended. If you need to change from extended to inline or inline to
          extended you can select the kind of track you want, it will save
          automatically.
        </p>

        <h3>View Saved Clips:</h3>
        <p>
          There is a new navigation button to the right of the Inline/Extended
          buttons. Here you can quickly tab or mouse click down to the track you
          want to work on. The red toolbar will automatically settle at the
          beginning of the track you are editing.
        </p>

        <h3>Using the Notes section:</h3>
        <p>
          Watch the entire video and make your notes for each track in the
          section to the right of the video. Be brief, be descriptive. Please
          write down anything printed. A full tutorial on good audio description
          can be found{' '}
          <a href="https://www.youtube.com/watch?v=24Pmmo9wKik&amplist=PLNJrbI_nyy9uzywoJfyDRoeKA1SaIEFJ7">
            here
          </a>
          . Once you have all your notes written, you are ready to start
          recording!
        </p>

        <h3>Making or editing your first track:</h3>
        <p>
          To begin creating your first track, choose either the yellow Add
          Inline button or the fuchsia Add Extended button. A creation panel
          will open with all the tools you’ll need.
        </p>
        <p>
          The first text box lets you name your track. Choose a short,
          descriptive title to make it easy to find and edit later. The next box
          allows you to select the track type—either Visual or Text on Screen.
          If you use text-to-speech, visual tracks are read with a
          higher-pitched voice, and text-on-screen tracks are read with a
          lower-pitched voice.
        </p>
        <p>
          Below that, you’ll see the timeline timecode where the red storyline
          bar is currently stopped. This marks the point where your new track
          will be inserted. Try to place the storyline bar as close as possible
          to where you want the track to appear. You can adjust it afterwards,
          but very large adjustments can make editing a bit more difficult.
        </p>
        <p>
          Next, choose how you want to create the description. You can type a
          TTS RECORD, which will be read by the synthetic voice, or you
          can make a VOICE RECORD using your own voice. Recording your own
          voice usually produces higher-quality audio description. You can
          switch between text and audio later if you need to.
        </p>
        <p>
          If you want to use TTS RECORD (speech-to-text), simply enter the
          text in the provided box, and press the green save button. If you
          choose to record your voice (highly recommended), a red microphone
          button will appear. Press it to start; a countdown—three, two, one,
          go—will play before recording begins. Start speaking just after the
          countdown ends so you have a moment to breathe and prepare. Press the
          microphone button again to stop the recording, then select the white
          square to confirm that you’re finished. You can re-record your voice
          as many times as you like.
        </p>
        <p>
          When everything sounds right and you’re satisfied with the result,
          press SAVE or UPDATE to add your completed track.
        </p>

        <h3>Deleting a track:</h3>
        <p>
          Click the red trashcan symbol under the track. Easy! Under some
          conditions you can undo the last track you mistakenly deleted (but
          best not to count on it). The UNDO button is yellow, and on the far
          right of the screen, below the timeline bar, and above the audio
          description tracks.
        </p>

        <h3>Saving your work:</h3>
        <p>
          While you will still need to press “save” or “update” for all of your
          track recordings (both synthetic text-to-speech, and your personal
          voice recordings), the notes section, the nudge feature, and the
          direct time stamp inputs are auto saved.
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

        <h3>Using the Nudge feature:</h3>
        <p>
          To move the track a quarter of a second (0.25) sooner, click the left
          arrow button, to move it half a second later click the right arrow
          button. You can click it as many times as you need to get it to settle
          in exactly the right spot. Nudging is saved automatically.
        </p>

        <h3>Converting Inline/Extended:</h3>
        <p>
          You can use a mix of inline and extended audio tracks, and they can be
          converted from Extended to Inline, and vice versa using the buttons to
          the right of the nudge bar. Sometimes when a track overlaps by more
          than 0.25 seconds, it will auto convert to an extended track (this
          helps our playback API get the correct timing without skipping a
          track). A combination of editing (making the tracks shorter), and
          nudging (changing the time) will separate your tracks so they both can
          be inline. If two tracks are very close, you might want to combine
          them into a single longer track.
        </p>

        <h3>Using the Time Controls:</h3>
        <p>
          Some people prefer to enter the start time manually rather than
          nudging the track. Enter the start time you want in the timing control
          box. You can change both seconds and milliseconds. Your new start time
          is saved when you do your next keystroke, or mouse select. The end
          time will update automatically. Sometimes the exact time you input is
          moved a little bit, to optimize the playback with YouTube.
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
          right arrows to move it 0.25 seconds sooner or later.
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
          with extended description, it is best to say only as much as is
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
          another one with a shorter description, and then change the speed.
        </p>

        <h3>
          Q: I made a lot of extended tracks and now the video is super long,
          and boring.
        </h3>
        <p>
          A: It happens to the best of us. We want to be thorough and get
          everything in there! Chances are the video is a little over described.
          Try cutting down your script, and re-recording a few tracks.
        </p>

        <h3>Q: I missed a section I needed to describe, how do I fix it?</h3>
        <p>
          A: Save your work, then refresh the video so you can play it from the
          beginning. Advance the video or the red storybar until you are in the
          right spot and click the red microphone button to start recording,
          click the white square when you are finished speaking. The track will
          be placed in the correct order automatically.
        </p>

        <h3>Q: How long will my content be saved on YouDescribe?</h3>
        <p>
          A: Your descriptions will be stored on YouDescribe until you delete
          them. We do archive your audio descriptions, but they cannot be played
          by anyone from the forward facing tool.
        </p>

        <h3>Q: Can I download my descriptions for my own use off-line?</h3>
        <p>
          A: This feature is not currently available, but stay tuned for
          possible developments in this area.
        </p>

        <h3>Q: Can I edit descriptions recorded by other users?</h3>
        <p>
          A: Yes, if they have selected “collaborative editing” you can edit the
          tracks they have already made. Record your voice, clean up the
          synthetic voice text, reseat a track. Users will have access to both
          descriptions and can choose which one they want. If you don’t want
          anyone to edit your audio description, uncheck the collaborative
          editing box found to the left of the publish button under the notes
          section before you publish.
        </p>

        <h3>Q: How long will my content be saved on YouDescribe?</h3>
        <p>
          A: Your descriptions will be stored on YouDescribe until you unpublish
          them. They still exist in your drafts folder, and you can come back to
          them at any time.
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
