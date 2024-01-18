import { translate } from '@/App'
import React, { useState, useEffect, useRef } from 'react'
import Button from '../../Button/Button'
import { useNavigate, useLocation } from 'react-router-dom'
import './searchBar.scss'

const SearchBar = () => {
  const [search, setSearch] = useState<string>('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [userSearchHistory, setUserSearchHistory] = useState<string[]>([])
  const [enteredValue, setEnteredValue] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const updateSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = encodeURIComponent(enteredValue || search)
    setUserSearchHistory((prevHistory) => [
      enteredValue || search,
      ...prevHistory.filter((item) => item !== (enteredValue || search)),
    ])
    localStorage.setItem('userSearchHistory', JSON.stringify(userSearchHistory))
    navigate(`/search?q=${q}`)
    setSearch('')
    setSuggestions([])
    setShowDropdown(false)
  }

  const fetchSuggestions = (input: string) => {
    setEnteredValue(input)
    setSearch(input)
    const filteredSuggestions = userSearchHistory.filter((historyItem) =>
      historyItem.toLowerCase().includes(input.toLowerCase()),
    )
    setSuggestions(filteredSuggestions)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearch(suggestion)
    setEnteredValue(suggestion)
    setSuggestions([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    fetchSuggestions(inputValue)
    setShowDropdown(true)
  }

  const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSuggestions([])
      if (inputRef.current) {
        inputRef.current.blur()
        setEnteredValue(search)
        setShowDropdown(false)
      }
    }
  }

  const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const inputValue = e.currentTarget.value
      fetchSuggestions(inputValue)
    }
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleDocumentClick = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    setSearch('')
  }, [location])

  useEffect(() => {
    const storedSearchHistory = localStorage.getItem('userSearchHistory')
    if (storedSearchHistory) {
      setUserSearchHistory(JSON.parse(storedSearchHistory))
    }
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])

  return (
    <div id="search-bar">
      <form className="w3-row" role="search" onSubmit={(e) => updateSearch(e)}>
        <div className="w3-left">
          <input
            ref={inputRef}
            id="search-input"
            title={translate(
              'Search for a YouTube video. If a video with an audio description matching the search criteria exists, it will be available in the first section. If not, Youtube videos without audio descriptions matching the search criteria will be listed in the second section and requests for any of those videos can be made.',
            )}
            className="w3-padding-small w3-border w3-border-indigo"
            type="search"
            name="search"
            onChange={(e) => handleInputChange(e)}
            onKeyPress={(e) => handleEnterKeyPress(e)}
            onKeyDown={(e) => handleBackspace(e)}
            onFocus={handleInputFocus}
            placeholder={translate('Search')}
            value={search}
            autoComplete="off"
          />
          {showDropdown && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  className={`suggestion-item`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w3-left">
          <Button
            ariaLabel={translate('Search')}
            text={translate('Search')}
            color="w3-indigo"
          />
        </div>
      </form>
    </div>
  )
}

export default SearchBar
