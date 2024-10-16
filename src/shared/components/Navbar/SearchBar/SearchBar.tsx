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

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setSearch(inputValue)

    // Filter suggestions based on input value
    const filteredSuggestions = userSearchHistory.filter((historyItem) =>
      historyItem.toLowerCase().includes(inputValue.toLowerCase()),
    )
    setSuggestions(filteredSuggestions)

    // Show dropdown if input value is not empty
    setShowDropdown(inputValue !== '')
  }

  // Function to handle form submission
  const updateSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const searchTerm = enteredValue || search

    if (!searchTerm || searchTerm.trim() === '') {
      setSearch('')
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    const q = encodeURIComponent(searchTerm)

    // Update search history in the state
    setUserSearchHistory((prevHistory) => {
      const updatedHistory = [
        searchTerm,
        ...prevHistory.filter((item) => item !== searchTerm),
      ]

      // Save updated history to localStorage
      localStorage.setItem('userSearchHistory', JSON.stringify(updatedHistory))

      return updatedHistory
    })

    if (searchTerm.trim() !== '') {
      navigate(`/search?q=${q}`)
    }

    setSuggestions([])
    setShowDropdown(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearch(suggestion)
    setEnteredValue(suggestion)
    setSuggestions([])
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSuggestions([])
      setShowDropdown(false)
    }
  }

  const handleClickOutsideInput = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowDropdown(false)
    }
  }

  // Load search history from localStorage on component mount
  useEffect(() => {
    const storedSearchHistory = localStorage.getItem('userSearchHistory')
    if (storedSearchHistory) {
      setUserSearchHistory(JSON.parse(storedSearchHistory))
    }
  }, [])

  useEffect(() => {
    const clearSearchOnNavigation = () => {
      if (!location.pathname.startsWith('/search')) {
        setSearch('') // Clear search term only when leaving the search page
      }
    }

    clearSearchOnNavigation()
  }, [location.pathname])

  useEffect(() => {
    inputRef.current?.addEventListener('click', () => setShowDropdown(true))
    window.addEventListener('click', handleClickOutsideInput)

    return () => {
      inputRef.current?.removeEventListener('click', () =>
        setShowDropdown(true),
      )
      window.removeEventListener('click', handleClickOutsideInput)
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
            onChange={(e) => handleInputChange(e)} // Updated onChange handler
            onKeyDown={(e) => handleKeyDown(e)} // Added keydown handler
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
