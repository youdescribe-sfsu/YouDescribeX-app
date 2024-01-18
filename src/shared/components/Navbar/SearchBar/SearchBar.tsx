import { translate } from '@/App'
import React, { useState, useEffect } from 'react'
import Button from '../../Button/Button'
import { useNavigate, useLocation } from 'react-router-dom'
import './searchBar.scss'

const SearchBar = () => {
  const [search, setSearch] = useState<string>('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [userSearchHistory, setUserSearchHistory] = useState<string[]>([])
  const [enteredValue, setEnteredValue] = useState<string>('') // New state to store input after Enter is clicked
  const inputRef = React.useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const updateSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = encodeURIComponent(enteredValue || search) // Use enteredValue if available, otherwise use search

    // Add the entered value to user search history
    setUserSearchHistory((prevHistory) => [
      enteredValue || search,
      ...prevHistory.filter((item) => item !== (enteredValue || search)),
    ])

    localStorage.setItem('userSearchHistory', JSON.stringify(userSearchHistory))
    navigate(`/search?q=${q}`)
    setSearch('') // Clear the search input
    setSuggestions([]) // Hide suggestions after clicking Enter
  }

  const fetchSuggestions = (input: string) => {
    setEnteredValue(input)
    setSearch(input)

    // Filter suggestions from the stored search history
    const filteredSuggestions = userSearchHistory.filter((historyItem) =>
      historyItem.toLowerCase().includes(input.toLowerCase()),
    )
    setSuggestions(filteredSuggestions)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearch(suggestion)
    setEnteredValue(suggestion) // Update enteredValue on suggestion click
    setSuggestions([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    fetchSuggestions(inputValue)
  }

  const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Handle Enter key press if needed
      setSuggestions([]) // Hide suggestions after clicking Enter
      if (inputRef.current) {
        inputRef.current.blur() // Blur the input to remove focus
        setEnteredValue(search) // Set enteredValue after Enter is clicked
      }
    }
  }

  const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      // If backspace is pressed, filter suggestions based on the updated input
      const inputValue = e.currentTarget.value
      fetchSuggestions(inputValue)
    }
  }

  useEffect(() => {
    setSearch('')
  }, [location])

  useEffect(() => {
    // Load user search history from local storage on component mount
    const storedSearchHistory = localStorage.getItem('userSearchHistory')
    if (storedSearchHistory) {
      setUserSearchHistory(JSON.parse(storedSearchHistory))
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
            placeholder={translate('Search')}
            value={search}
          />
          {suggestions.length > 0 && (
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
