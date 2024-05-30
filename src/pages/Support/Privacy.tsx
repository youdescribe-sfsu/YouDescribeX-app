import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './support.scss'

const Privacy = () => {
  useEffect(() => {
    document.title = 'Privacy Policy'
  }, [])

  return (
    <div id="support" tabIndex={-1}>
      <header role="banner" className="w3-container w3-indigo">
        <h2>Privacy Policy</h2>
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
        <div style={{ marginTop: 20, marginBottom: 20, textAlign: 'center' }}>
          <h2>Privacy Policy for YouDescribe</h2>
        </div>
        <div style={{ marginLeft: 50, marginRight: 50 }}>
          <p>
            This policy describes the information we process to support
            YouDescribe.
          </p>
          <p>
            <h4>
              <b>What kinds of information do we collect?</b>
            </h4>
          </p>
          <p>
            To provide the YouDescribe tool, we must process information about
            you. The types of information we collect depend on how you use our
            tool.
          </p>
          <p>Things you and others do and provide.</p>
          <ul>
            <li>
              Information and content you provide. We collect the content,
              communications and other information you provide when you use our
              tool, including when you sign up for an account, create content,
              and message the YouDescribe help and support team. This can
              include information in or about the content you provide (like your
              audio descriptions or wishlist items), such as the word count in
              an audio track or the date a file was created. It can also include
              what you see through features we provide, such as our search
              function. Our systems automatically process content and
              communications you and others provide to analyze context and train
              a human in the loop automated audio description function. All the
              data collected from your audio descriptions is anonymized (not
              associated with a specific account). Your videos are viewable by a
              wide audience.
            </li>
          </ul>
          <p>
            <h4>
              <b>How do we use this information?</b>
            </h4>
          </p>
          <p>
            We use the information we have (subject to choices you make) as
            described below and to provide and support the YouDescribe tool.
          </p>
          <p>Here&apos;s how:</p>
          <p>Provide, personalize and improve our tool.</p>

          <p>
            We use the information we have to deliver our tool, including to
            personalize features and content like feedback on audio
            descriptions, email notifications you may select, and to keep track
            of any administrative emails.
          </p>
          <ul>
            <li>
              Product research and development: We use the information we have
              to develop, test and improve our tool, including by conducting
              surveys and research, and testing and troubleshooting new
              features.
            </li>
          </ul>
          <p>Research and innovate for social good.</p>
          <p>
            We use the information we have (including from research partners we
            collaborate with) to conduct and support research and innovation on
            topics of general social welfare, technological advancement, public
            interest, health and well-being.We use the information we have to
            help researchers at Smith-Kettlewell and our research collaborators
            measure the effectiveness, distribution, and utility of audio
            descriptions created with YouDescribe.
          </p>
          <p>Promote safety, integrity and security.</p>
          <p>
            We use the information we have to verify accounts and activity,
            combat harmful conduct, detect and prevent spam and other bad
            experiences, maintain the integrity of our tool, and promote safety
            and security on and off of YouDescribe tool. For example, we use
            data we have to investigate suspicious activity or violations of our
            terms.
          </p>
          <p>Communicate with you.</p>
          <p>
            We use the information we have to send you marketing communications,
            communicate with you about our tool, and let you know about our
            policies and terms. We also use your information to respond to you
            when you contact us.
          </p>
          <p>
            <h4>
              <b>How is this information shared?</b>
            </h4>
          </p>
          <p>Your information is shared with others in the following ways:</p>
          <p>
            Sharing on YouDescribe tool through posting audio descriptions or
            requesting items for the wishlist.
          </p>
          <p>
            Public information can be seen by anyone, on or off our tool,
            including if they don&apos;t have an account. This includes your
            google login, or alias username; any information you share with a
            public audience; and content you share on YouDescribe. YouDescribe
            is potentially visible in search results, or through tools and APIs.
            Public information can also be seen, accessed, reshared or
            downloaded through third-party services such as search engines,
            APIs, and offline media such as TV, and by apps, websites.
          </p>
          <p>
            <h4>
              <b>How can I manage or delete information about me?</b>
            </h4>
          </p>
          <p>
            We store data until it is no longer necessary to provide our
            services and YouDescribe tool, or until your account is deleted -
            whichever comes first. This is a case-by-case determination that
            depends on things like the nature of the data, why it is collected
            and processed, and relevant legal or operational retention needs.
          </p>
          <p>
            <h4>
              <b>How will we notify you of changes to this policy?</b>
            </h4>
          </p>
          <p>
            We&apos;ll notify you before we make changes to this policy and give
            you the opportunity to review the revised policy before you choose
            to continue using our tool.
          </p>

          <p>
            <h4>
              <b>How do we use Google and YouTube service?</b>
            </h4>
          </p>
          <p>
            The YouDescribe website and iOS app allow you to sign in with Google
            Account. For Google Privacy Policy, click{' '}
            <Link to="https://policies.google.com/privacy" target="_blank">
              here
            </Link>
            .
          </p>
          <p>
            The YouDescribe website and iOS app fetch data from YouTube. For
            YouTube Terms of Service, click{' '}
            <Link to="https://www.youtube.com/t/terms" target="_blank">
              here
            </Link>
            .
          </p>
          <p>
            User data is used with the permission of the user by signing into
            their Google account. This permission can be revoked by the user
            through,{' '}
            <a href="https://security.google.com/settings/security/permissions">
              this setting page.
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Privacy
