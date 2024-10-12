import React, { useEffect } from 'react'
import { toast } from 'react-toastify'
import { Code, PlusSquareFill } from 'react-bootstrap-icons'
import './sharebar.scss'

interface Props {
  videoTitle: string
}

const ShareBar = ({ videoTitle }: Props) => {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = 'SocialShareKit.init();'
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const twitterText = `Check out ${videoTitle.substring(
    0,
    50,
  )} w/ #AudioDescription on YouDescribe ${
    window.location.href
  } #a11y @SKERI_YD`
  const emailText = `Watch this video with audio description on YouDescribe:\n\n${videoTitle}\n${window.location.href}\n\nTo learn more about accessible video with audio description,\nfollow YouDescribe on Twitter or Facebook:\n\nhttp://twitter.com/SKERI_YD\nhttp://facebook.com/YouDescribe`

  return (
    <div
      id="share-bar"
      className="ssk-sticky ssk-left ssk-center ssk-lg share-bar"
    >
      <a
        href="#"
        className="ssk ssk-facebook"
        aria-label="Share this video on Facebook"
        title="Share this video on Facebook"
      ></a>
      <a
        href="#"
        className="ssk ssk-twitter"
        aria-label="Share this video on Twitter"
        data-text={twitterText}
        title="Share this video on Twitter"
      ></a>
      <a
        href="#"
        className="ssk ssk-email"
        aria-label="Share this video by e-mail"
        data-text={emailText}
        title="Share via Email"
      ></a>
      <a
        title="Copy Embed Link"
        href="#"
        className="ssk embed"
        aria-label="Copy link to embed this video, the link will be copied to the clipboard"
        onClick={() => {
          navigator.clipboard.writeText(
            window.location.href.replace('video', 'embed'), //returns link to the embed page with video id
          )
          toast.info('The embed link has been copied to your clipboard!', {
            position: 'bottom-center',
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          })
        }}
      >
        <PlusSquareFill></PlusSquareFill>
      </a>
      <a
        title="Copy to create an html code snippet"
        href="#"
        className="ssk embed"
        aria-label="Copy the HTML code to embed this video on a website or blog."
        onClick={() => {
          navigator.clipboard.writeText(
            `<iframe width="560" height="315" src="${window.location.href.replace(
              'video',
              'embed',
            )}"></iframe>`,
          )

          toast.info('The snippet has been copied to your clipboard!', {
            position: 'bottom-center',
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          })
        }}
      >
        <Code></Code>
      </a>
    </div>
  )
}

export default ShareBar
