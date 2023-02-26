import '@/assets/css/home.css'

const Spinner = () => {
  return (
    <div className="spinner-div justify-content-center align-items-center w-100 h-100 position-fixed">
      <div
        className="spinner-border text-light"
        style={{ width: '3rem', height: '3rem' }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}

export default Spinner
