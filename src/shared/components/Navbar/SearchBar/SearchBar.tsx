import { translate } from '@/App'
import React, { useState, useEffect } from 'react'
import Button from '../../Button/Button'
import { useNavigate, useLocation } from 'react-router-dom'
import './searchBar.scss'

const SearchBar = () => {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const updateSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const q = encodeURIComponent(search)
    navigate(`/search?q=${q}`)
  }

  useEffect(() => {
    // Clear the search input when the location changes
    setSearch('')
  }, [location])

  // useEffect(() => {
  //   // Check if it's a page load or refresh
  //   const isPageLoadOrRefresh = performance.navigation.type === 1

  //   if (isPageLoadOrRefresh) {
  //     // Clear the search input on page load or refresh
  //     setSearch('')
  //     // Redirect to the home page
  //     window.location.href = '/'
  //   }
  // }, [])

  return (
    <div id="search-bar">
      <form className="w3-row" role="search" onSubmit={(e) => updateSearch(e)}>
        <div className="w3-left">
          <input
            id="search-input"
            title={translate(
              `Search for a YouTube video. If a video with an audio description matching the search criteria exists, it will be available in the first section. If not, Youtube videos without audio descriptions matching the search criteria will be listed in the second section and requests for any of those videos can be made.`,
            )}
            className="w3-padding-small w3-border w3-border-indigo"
            type="search"
            name="search"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translate('Search')}
            value={search}
          />
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
