import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

interface Props {
  id: string
  title: string
  text: string
  modalTask: (e: any) => void
  show: boolean
  handleClose: () => void
}

const ModalComponent = ({
  id,
  title,
  text,
  modalTask,
  show,
  handleClose,
}: Props) => {
  return (
    // <div className="modal fade text-dark" id={modalId}>
    <Modal show={show} onHide={handleClose}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content mx-auto w-75">
          {/* <!-- Modal Header --> */}
          <div className="modal-header">
            <h4 className="modal-title">{title}</h4>
            <Button className="btn-close" onClick={handleClose}></Button>
          </div>
          {/* <!-- Modal body --> */}
          <div className="modal-body text-center">{text}</div>
          {/* <!-- Modal footer --> */}
          <div className="modal-footer d-flex justify-content-evenly align-items-center">
            <Button
              className="btn primary-btn-color text-center m-1 text-white w-25"
              onClick={(e) => {
                modalTask(e)
                handleClose()
              }}
            >
              YES
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
      {/* </div> */}
    </Modal>
  )
}

export default ModalComponent
