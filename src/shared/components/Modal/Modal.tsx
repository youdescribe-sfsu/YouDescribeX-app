import React, { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

interface Props {
  children?: React.ReactNode
  id?: string
  title: string
  text: string
  modalTask: (e: any, checkbox?: boolean, selectedLanguageCode?: string) => void // Update modalTask function signature to include selectedLanguageCode
  show: boolean
  handleClose: () => void
  showCheckbox?: boolean
  checkBoxText?: string
  languages?: { code: string; name: string }[] // Make languages prop optional
  showLanguageSelector?: boolean
}

const ModalComponent: React.FC<Props> = ({
  title,
  text,
  modalTask,
  show,
  handleClose,
  showCheckbox = false,
  checkBoxText = 'Include additional information',
  languages,
  showLanguageSelector = false, // Set default value for showLanguageSelector
}: Props) => {
  const [isChecked, setIsChecked] = useState(false)
  const [selectedLanguageCode, setselectedLanguageCode] = useState('')

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
  }
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setselectedLanguageCode(e.target.value)
  }

  return (
    <>
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
              {showCheckbox && (
                <Form>
                  <Form.Check
                    type="checkbox"
                    label={checkBoxText}
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                  />
                </Form>
              )}
              {showLanguageSelector && languages && (
                <Form.Select
                  onChange={handleLanguageChange}
                  value={selectedLanguageCode || 'en'} // Set default value to 'en' if selectedLanguageCode is not set
                >
                  <option value="">Select Language</option>
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </Form.Select>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-evenly align-items-center">
              <Button
                className="btn primary-btn-color text-center m-1 text-white w-25 ydx-button"
                onClick={(e) => {
                  modalTask(e, isChecked, selectedLanguageCode)
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
    </>
  )
}

export default ModalComponent
