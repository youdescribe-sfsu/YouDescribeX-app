import React, { useState } from 'react'
import ModalComponent from '../../shared/components/Modal/Modal'

interface Language {
  code: string
  name: string
}

interface Props {
  show: boolean
  handleClose: () => void
  handleGenerateAIDescriptions: (selectedLanguageCode: string) => void
  languages: Language[]
  showLanguageSelector: boolean
}

const LanguageSelector: React.FC<Props> = ({
  show,
  handleClose,
  handleGenerateAIDescriptions,
  languages,
  showLanguageSelector,
}: Props) => {
  // const [selectedLanguageCode, setselectedLanguageCode] = useState('')

  const handleConfirm = (
    e: any,
    checkbox?: boolean,
    selectedLanguageCode?: string,
  ) => {
    handleGenerateAIDescriptions(selectedLanguageCode ?? '')
  }

  return (
    <>
      {showLanguageSelector && ( // Conditionally render the modal only if showLanguageSelector is true
        <ModalComponent
          id="languageSelectorModal"
          title="Select Language"
          text="Please select a language for AI descriptions:"
          modalTask={handleConfirm}
          show={show}
          handleClose={handleClose}
          languages={languages}
          showLanguageSelector={showLanguageSelector}
        ></ModalComponent>
      )}
    </>
  )
}

export default LanguageSelector
