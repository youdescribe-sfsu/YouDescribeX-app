import React, { useState } from 'react' // Import the useState hook
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

interface Props {
  id: string
  title: string
  text: string
  modalTask: (e: any, checkbox?: boolean) => void
  show: boolean
  handleClose: () => void
  showCheckbox?: boolean // Conditionally show the checkbox
  checkBoxText?: string // Customize checkbox text
}

const ModalComponent = ({
  title,
  text,
  modalTask,
  show,
  handleClose,
  showCheckbox = false, // Default to false if not provided
  checkBoxText = 'Include additional information', // Default text
}: Props) => {
  const [isChecked, setIsChecked] = useState(false) // Add a checkbox state

  // Function to handle checkbox change
  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
  }

  return (
    <Modal show={show} onHide={handleClose}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content mx-auto w-75">
          <div className="modal-header">
            <h4 className="modal-title">{title}</h4>
            <Button
              className="btn-close ydx-button"
              onClick={handleClose}
            ></Button>
          </div>
          <div className="modal-body text-center">
            {text}
            {showCheckbox && ( // Conditionally render the checkbox
              <Form>
                <Form.Check
                  type="checkbox"
                  label={checkBoxText} // Use the provided or default text
                  checked={isChecked} // Bind the checkbox to the state
                  onChange={handleCheckboxChange} // Handle checkbox change
                />
              </Form>
            )}
          </div>
          <div className="modal-footer d-flex justify-content-evenly align-items-center">
            <Button
              className="btn primary-btn-color text-center m-1 text-white w-25 ydx-button"
              onClick={(e) => {
                modalTask(e, isChecked)
                handleClose()
              }}
            >
              YES
            </Button>
            <Button
              variant="secondary"
              className="ydx-button"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalComponent
