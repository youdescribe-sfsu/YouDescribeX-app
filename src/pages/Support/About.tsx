import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './support.scss'

const About = () => {
  useEffect(() => {
    // document.getElementById('support').focus();
  }, [])

  return (
    <div id="support" tabIndex={-1}>
      <header role="banner" className="w3-container w3-indigo">
        <h2>General information about YouDescribe</h2>
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
        {/* <a name="top" className="anchor"></a> */}

        <h2>About YouDescribe</h2>

        <p>
          Much of the content here is covered in our YouDescribe playlist:{' '}
          <a href="https://www.youtube.com/playlist?list=PLNJrbI_nyy9sjqZ-Wcn6sX868i9KtdNrT">
            What is YouDescribe? A video tutorial.
          </a>
        </p>

        <h3>Q: Is YouDescribe really free?</h3>
        <p>
          A: Yes! Anyone can play or describe YouTube videos for free using
          YouDescribe.
        </p>

        <h3>Q: Who should be using YouDescribe?</h3>
        <p>
          A: Everyone who supports or needs audio description (AD) can use
          YouDescribe (YD). People who are blind or have low vision (BLV) can
          benefit from descriptions recorded by sighted describers, but other
          viewers like individuals on the autism spectrum, or those learning a
          new language can benefit from AD as well. Descriptions can be
          contributed by anyone with the time, skill, and inclination, including
          parents, teachers, and friends and fans. Many people may just think
          YouDescribe is cool and want to try it.
        </p>

        <h3>Q: What is so important about description?</h3>
        <p>
          A: In addition to video’s enormous entertainment, and cultural
          importance, video is being used in more and more educational and
          employment situations. While videos can sometimes be completely
          understandable by a blind viewer simply by listening to the sound
          track, usually there are visual elements that have no audible
          equivalent. For example, when someone demonstrating a yoga pose says,
          “Hold your arms like this,” or a crafting demonstrator says, “Glue
          this piece like this,” the BLV viewer is barred from using that video
          as a learning tool. On-screen text, scene changes, and body language
          are all video elements that may need some description in order for a
          blind viewer to follow a story. Adding description makes video
          accessible. That’s important!
        </p>

        <h3>Q: What’s so cool about YouDescribe?</h3>
        <p>
          A: YouDescribe is unique in that it allows anybody, anywhere to
          contribute a description for an existing video and let a blind or low
          vision viewer check it out right away. The best part is that it does
          so without modifying or redistributing the existing YouTube video. It
          is not a separate version, it’s the same version with description
          played as the video plays.
        </p>

        <h3>Q: How does YouDescribe work?</h3>
        <p>
          A: Sighted people view YouTube videos and record descriptions of what
          they see. When the video is played with YouDescribe, the descriptions
          are played back with the video. YouDescribe uses an exclusive API to
          store description clips and information about them. YouDescribe knows
          what video each clip belongs to and what time the clip should be
          played. Lots of other information is stored along with the
          descriptions, including who recorded it, when it was recorded, how
          popular it is, etc. YouDescribe is the first video service to allow
          anybody, anywhere, to record and upload video descriptions. It
          provides a unique way for people to get descriptions for the
          instructional, informational, and entertainment videos offered on
          YouTube.
        </p>

        <h3>
          Q: Can YouDescribe be used for videos other than those on YouTube?
        </h3>
        <p>
          A: No. A video must be hosted on YouTube for YouDescribe to add an
          audio description. If the video you want to describe isn’t already on
          YouTube, you can create your own channel and upload the content there.
          Instructions for creating a channel are available through{' '}
          <a href="https://support.google.com/youtube/answer/1646861?hl=en">
            Google Support
          </a>
          . Be aware that the YouDescribe API key updates every 24 hours, so
          there may be a delay between when a video is posted and when
          YouDescribe can access it. The system also restricts access to content
          appropriate for users age 13 and under. Because of this, certain
          trailers, TV episodes, or other general-audience videos may not be
          available. In addition, some YouTube channels block third-party apps
          from playing their content, which can also limit access within
          YouDescribe.
        </p>

        <h3>Q: Who built YouDescribe?</h3>
        <p>
          A: The Smith-Kettlewell Video Description Research and Development
          Center developed the Descriptive Video Exchange and YouDescribe. Our
          brand new AI prompted interface was developed in partnership with the
          San Francisco State Computer Science department, Northeastern
          University and YouDescribe.
        </p>
        <p>
          YouDescribe is supported by grants from: National Eye Institute-
          R01EY020925, 2010-2014; Department of Education- H327J110005
          2011-2013; NIDILRR- RERC on Blindness and Low Vision- 90RE5024
          2016-2022 and 90REGE0018 2022-2027; Ability Central (formerly The
          Disabilities Communication Fund)- Improving Access to Described Video
          2016-2017, Training the Next Generation of Audio Describers 2017-2018,
          and Machine Learning Enhanced Video Accessibility for the Blind
          2020-2025, YouDescribe: The Future of Inclusive Media 2026-2028.
        </p>
        <p>
          The website <a href="https://youdescribe.org">YouDescribe.org</a> is
          developed and maintained under a grant from the National Institute on
          Disability, Independent Living, and Rehabilitation Research (NIDILRR
          grant number 90 REGE0018). NIDILRR is a Center within the
          Administration for Community Living (ACL), Department of Health and
          Human Services (HHS). The contents of this tutorial do not necessarily
          represent the policy of NIDILRR, ACL, or HHS, and you should not
          assume endorsement by the Federal Government.
        </p>

        <h3>Q: How do I play a described video with YouDescribe?</h3>
        <p>
          A: To play a YouDescribe video, you do not need to be logged in.
          Simply go to the main search page of YouDescribe and click on the
          title of any of the videos listed. The most recently described videos
          appear at the top of the list. Find any video by using the search
          field on this page. The search function works with YouTube video
          title, YouTube ID, name of describer, and a keyword search. While
          videos with descriptions are listed first, if you tab down to
          undescribed videos, and select the Search YouTube button it will bring
          up undescribed videos. (we do this so the pages load as quickly as
          possible). If you don’t find the video you want to view, it’s probably
          lower in the list than you expect.
        </p>
        <p>
          The most consistent way to search at YouDescribe is by YouTube ID. The
          ID is the alphanumeric string after &quot;v=&quot; in the watch URL,
          such as in:{' '}
          <a href="https://www.youtube.com/watch?v=aqz-KE-bpKQ">
            https://www.youtube.com/watch?v=aqz-KE-bpKQ
          </a>
          . You can find the ID by copying the URL and observing the characters
          after &quot;v=&quot;. Or if the URL is in the short form, The ID is
          the alphanumeric string after &quot;youtu.be/&quot;, such as in:{' '}
          <a href="https://youtu.be/aqz-KE-bpKQ">
            https://youtu.be/aqz-KE-bpKQ
          </a>
          . You can find the ID by copying the URL and observing the characters
          after &quot;youtu.be/&quot;.
        </p>

        <h3>Q: How do I become a registered YouDescribe user?</h3>
        <p>
          A: Becoming a registered user allows you to rate descriptions, and
          create your own! Log in to your account using a Google ID (you must
          have a google ID to rate and add descriptions. If you don’t have a
          Google ID, an account is free and easy to get at:{' '}
          <a href="https://accounts.google.com/SignUp?hl=en">
            https://accounts.google.com/SignUp?hl=en
          </a>
          ). At www.youdescribe.org you will be prompted to type in your google
          address, and password. Once you have logged in, you are ready to start
          rating videos, and doing audio description (AD). While most of our
          describers use their legal name at YouDescribe, we recommend anyone
          who wants more online privacy to make a google account just for your
          audio description that features a screen name and avatar.
        </p>

        <h3>Q: What browsers are compatible with YouDescribe?</h3>
        <p>
          A: YouDescribe works with most browsers: Chrome and Firefox are tested
          and updated most often (Chrome tends to work best, especially if the
          internet connection is slow).
        </p>

        <h3>Q: What operating systems are compatible with YouDescribe?</h3>
        <p>
          A: YouDescribe is compatible with any Mac or PC-based operating
          system.
        </p>

        <h3>
          Q: How do I share a described video with a friend or embed it in a
          webpage?
        </h3>
        <p>
          A: Sharing can be done in a couple of ways. On the left of every video
          is a quick share link for email, Facebook, and twitter. It generates
          an easy to share template for each social media platform. To share on
          a webpage one can copy the web address from the browser field at the
          top and use iframe or an object tag to embed the desired video.
        </p>

        <h3>Q: How can I send feedback or access technical support?</h3>
        <p>
          A: Please email us at:{' '}
          <a href="mailto: info@youdescribe.org">info@youdescribe.org</a>
        </p>
      </main>
    </div>
  )
}

export default About
