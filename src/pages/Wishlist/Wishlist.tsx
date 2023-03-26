import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import Spinner from '@/shared/components/Spinner/Spinner'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl } from '@/shared/config'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import getTimeZoneOffset from '@/shared/utils/getTimeZoneOffset'
import ourFetch from '@/shared/utils/ourFetch'
import React, { ChangeEvent, ReactNode, useEffect, useState } from 'react'
import DataTable, { Media, TableColumn } from 'react-data-table-component'
import { useNavigate } from 'react-router-dom'
import Select, { MultiValue } from 'react-select'
import './wishlist.scss'

const allCategories = [
  'Film & Animation',
  'Music',
  'Autos & Vehicles',
  'Travel & Events',
  'Pets & Animals',
  'Sports',
  'People & Blogs',
  'Gaming',
  'Comedy',
  'Entertainment',
  'How-To & Style',
  'News & Politics',
  'Nonprofits & Activism',
  'Education',
  'Science & Technology',
]

const Wishlist = () => {
  const [search, setSearch] = useState('')
  const [currentPageNumber, setCurrentPageNumber] = useState(1)
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [perPage, setPerPage] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [youTubeIds, setYouTubeIds] = useState<string[]>([])
  const [youDescribeIds, setYouDescribeIds] = useState<string[]>([])
  const [votes, setVotes] = useState<number[]>([])
  const [updatedAt, setUpdatedAt] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [videoCardsComponents, setVideoCardsComponents] = useState<ReactNode[]>(
    [],
  )
  const [showSpinner, setShowSpinner] = useState(true)

  const columns: TableColumn<any>[] = [
    {
      name: 'Thumbnail',
      grow: 0,
      cell: (row) => (
        <img
          height="40px"
          width="80px"
          alt={row.title}
          src={row.thumbnail.url}
        />
      ),
    },
    {
      name: 'Title',
      selector: (row) => row.title,
      grow: 3,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Author',
      selector: (row) => row.author,
      grow: 1,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Category',
      selector: (row) => row.category,
      grow: 1,
      sortable: true,
      wrap: true,
      hide: 'sm' as Media,
    },
    {
      name: 'Last Voted',
      selector: (row) => row.lastVoted,
      grow: 1,
      sortable: true,
      wrap: true,
      hide: 'md' as Media,
    },
    {
      name: 'Votes',
      selector: (row) => row.votes,
      grow: 0,
      sortable: true,
    },
    {
      cell: (row) => (
        <Button
          ariaLabel={translate('Create an audio description for this video')}
          text={translate('Describe')}
          color="w3-indigo w3-right"
          onClick={() => describeThisVideo(row.youTubeId)}
        />
      ),
      button: true,
      width: '90px',
    },
  ]

  const describeThisVideo = (youTubeId: string) => {
    if (userDataStore.getState().isSignedIn) {
      navigate('/authoring-tool/' + youTubeId)
    } else {
      alert(
        translate('You have to be logged in in order to describe this video'),
      )
    }
  }

  useEffect(() => {
    document.title = translate('YouDescribe - Wish List')
    loadTableVideos(currentPageNumber, perPage)
    loadTopVideos()
  }, [])

  /*
    Loads data for the table using the /wishlist/search endpoint
    The endpoint requires the following query parameters
      - page: The page number to be fetched
      - perPage: Number of items to be displayed on each page
      - search: The search string to be passed (joined with the %20 separator)
      - category: The list of categories that the search should be filtered by. Each category is comma separated and joined with the %20 separator.
  */
  const loadTableVideos = (pageNumber: number, rowsPerPage: number) => {
    const searchString = search.split(' ').join('%20')
    const categoryString = selectedCategories
      .map((category) => category.replace('&', '%26').split(' ').join('%20'))
      .join(',')
    const url = `${apiUrl}/wishlist/search?page=${pageNumber}&per_page=${rowsPerPage}${
      search !== '' ? `&search=${searchString}` : ''
    }${categoryString !== '' ? `&category=${categoryString}` : ''}`
    ourFetch(url)
      .then((response) => {
        const wishListItems = response.result.items
        setTotalRows(response.result.count)
        const youTubeIds = []
        const youDescribeIds = []
        const votes = []
        const updatedAt = []
        const categories = []
        for (let i = 0; i < wishListItems.length; i += 1) {
          youTubeIds.push(wishListItems[i].youtube_id)
          youDescribeIds.push(wishListItems[i]._id)
          votes.push(wishListItems[i].votes)
          updatedAt.push(wishListItems[i].updated_at)
          categories.push(wishListItems[i].category)
        }
        setYouTubeIds(youTubeIds)
        setYouDescribeIds(youDescribeIds)
        setVotes(votes)
        setUpdatedAt(updatedAt)
        setCategories(categories)
        return { youTubeIds, votes, categories, updatedAt }
      })
      .then(({ youTubeIds, votes, categories, updatedAt }) => {
        const url = `${apiUrl}/videos/getyoutubedatafromcache?youtubeids=${youTubeIds.join(
          ',',
        )}&key=wishlist`
        ourFetch(url).then((response) => {
          parseTableData(
            JSON.parse(response.result),
            votes,
            categories,
            updatedAt,
          )
        })
      })
      .catch((err) => {
        setTotalRows(0)
        setRows([])
      })
  }

  const parseTableData = (
    youTubeResponse: any,
    votes: any,
    categories: any,
    updatedAt: any,
  ) => {
    const rows = []
    for (let i = 0; i < youTubeResponse.items.length; i += 1) {
      const item = youTubeResponse.items[i]
      if (!item.statistics || !item.snippet) {
        continue
      }
      const youTubeId = item.id
      const thumbnailMedium = item.snippet.thumbnails.medium
      const title = item.snippet.title
      const author = item.snippet.channelTitle

      const now = Date.now() + new Date().getTimezoneOffset() * 60000
      const lastUpdatedAt = String(updatedAt[i])

      const lastUpdated = new Date(
        Number(lastUpdatedAt.slice(0, 4)),
        Number(lastUpdatedAt.slice(4, 6)) - 1,
        Number(lastUpdatedAt.slice(6, 8)),
        Number(lastUpdatedAt.slice(8, 10)),
        Number(lastUpdatedAt.slice(10, 12)),
        Number(lastUpdatedAt.slice(12)),
      ).getTime()

      const diffToLastUpdate = convertTimeToCardFormat(
        Number(now - lastUpdated),
      )

      const votesCount = votes[i]
      const category = categories[i]

      rows.push({
        title: title,
        votes: votesCount,
        author: author,
        youTubeId: youTubeId,
        thumbnail: thumbnailMedium,
        lastVoted: diffToLastUpdate,
        category: category,
      })
    }
    setRows(rows)
  }

  const loadTopVideos = () => {
    const url = `${apiUrl}/wishlist/top/`
    ourFetch(url)
      .then((response) => {
        const wishListItems = response.result
        const topYouTubeIds = []
        const topYouDescribeIds = []
        const topVotes = []
        for (let i = 0; i < wishListItems.length; i += 1) {
          topYouTubeIds.push(wishListItems[i].youtube_id)
          topYouDescribeIds.push(wishListItems[i]._id)
          topVotes.push(wishListItems[i].votes)
        }
        return { topYouTubeIds, topYouDescribeIds, topVotes }
      })
      .then(({ topYouTubeIds, topYouDescribeIds, topVotes }) => {
        const url = `${apiUrl}/videos/getyoutubedatafromcache?youtubeids=${topYouTubeIds.join(
          ',',
        )}&key=wishlist`
        ourFetch(url).then((response) => {
          parseFetchedData(
            JSON.parse(response.result),
            topYouDescribeIds,
            topYouTubeIds,
            topVotes,
          )
        })
      })
  }

  const parseFetchedData = (
    youTubeResponse: any,
    topYouDescribeIds: any,
    topYouTubeIds: any,
    topVotes: any,
  ) => {
    const videoCardsComponents = []
    for (let i = 0; i < youTubeResponse.items.length; i += 1) {
      const item = youTubeResponse.items[i]
      if (!item.statistics || !item.snippet) {
        continue
      }
      const _id = topYouDescribeIds[i]
      const youTubeId = item.id
      const thumbnailMedium = item.snippet.thumbnails.medium
      const title = item.snippet.title
      const description = item.snippet.description
      const author = item.snippet.channelTitle
      const views = convertViewsToCardFormat(Number(item.statistics.viewCount))
      const publishedAt = new Date(item.snippet.publishedAt)
      const now = Date.now()
      const votes = topVotes[i]
      const time = convertTimeToCardFormat(
        Number(now - publishedAt.getMilliseconds()),
      )

      videoCardsComponents.push(
        <div className="wishlist-video-card" key={_id}>
          <VideoCard
            youTubeId={youTubeId}
            thumbnailMediumUrl={thumbnailMedium.url}
            title={title}
            description={description}
            author={author}
            views={views}
            time={time}
            votes={votes}
            buttons="upvote-describe"
            //   getAppState={this.props.getAppState}
          />
        </div>,
      )
    }
    setShowSpinner(false)
    setVideoCardsComponents(videoCardsComponents)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }

  const handleCategoryChange = (
    selectedCategories: MultiValue<{ value: string; label: string }>,
  ) => {
    const values = Array.from(selectedCategories, (option) => option.value)
    setSelectedCategories(values)
  }

  const handlePageChange = (page: number) => {
    setCurrentPageNumber(page)
    loadTableVideos(page, perPage)
  }

  const handlePerRowsChange = (newPerPage: number) => {
    setPerPage(newPerPage)
    loadTableVideos(currentPageNumber, newPerPage)
  }

  return (
    <main id="wish-list" title="Wish list page" className="wish-list">
      <div className="w3-container w3-indigo">
        <h2 id="wish-list-heading" className="classic-h2" tabIndex={-1}>
          {translate('WISH LIST')}
        </h2>
      </div>
      {showSpinner ? <Spinner /> : null}
      <div className="w3-row-padding classic-container w3-margin-top">
        Most Requested Videos
      </div>
      <div className="w3-row-padding classic-container wishlist-video-row">
        {videoCardsComponents}
      </div>
      <div className="w3-row-padding classic-container search-container">
        <input
          type="text"
          placeholder="Search"
          className="search-input"
          value={search}
          onChange={handleChange}
        />
        <div className="category-select">
          <span className="category-label">Category</span>
          <Select
            options={allCategories.map((category) => {
              const option = { value: category, label: category }
              return option
            })}
            isMulti
            onChange={handleCategoryChange}
          />
        </div>
        <button
          className="w3-btn w3-indigo search-button"
          onClick={() => loadTableVideos(0, perPage)}
        >
          Search
        </button>
      </div>
      <div className="table-container">
        <DataTable
          title="All Wishlist Videos"
          columns={columns}
          data={rows}
          responsive
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          onChangePage={(page) => handlePageChange(page)}
          onChangeRowsPerPage={(newPerPage) => handlePerRowsChange(newPerPage)}
          customStyles={{
            cells: {
              style: {
                overflow: 'visible !important',
                whiteSpace: 'break-spaces !important',
                textOverflow: 'unset !important',
                overflowWrap: 'break-word !important',
              },
            },
          }}
        />
      </div>
    </main>
  )
}

export default Wishlist
