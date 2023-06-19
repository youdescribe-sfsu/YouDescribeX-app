import './pageNotFound.scss'

const PageNotFound = () => {
  return (
    <div id="not-found" className="w3-center">
      <h2 className="classic-h2">Unknown YouDescribe Page</h2>
      <p>
        Sorry! The link you followed doesn&apos;t point to a real YouDescribe
        page.
      </p>
      <p>
        Please visit{' '}
        <a href="/" className="classic-link">
          the YouDescribe home page
        </a>{' '}
        for the latest contributions.
      </p>
    </div>
  )
}

export default PageNotFound
