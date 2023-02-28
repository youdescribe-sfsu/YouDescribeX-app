const PageNotFound = () => {
  return (
    <div
      className="d-flex justify-content-center align-items-center ydx-body ydx-html"
      style={{ height: '100vh' }}
    >
      <div
        className="bg-white d-flex justify-content-center align-items-center flex-column p-4 rounded"
        style={{ height: '300px' }}
      >
        <h1>Wrong URL</h1>
        <p>
          The URL pattern to access YouDescribeX should be
          /&lt;videoId&gt;/&lt;userId&gt;
        </p>
      </div>
    </div>
  )
}

export default PageNotFound
