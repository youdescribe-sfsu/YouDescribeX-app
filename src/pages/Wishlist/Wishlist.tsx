import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import Spinner from '@/shared/components/Spinner/Spinner'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl } from '@/shared/config'
import axios, { CancelTokenSource } from 'axios'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import getTimeZoneOffset from '@/shared/utils/getTimeZoneOffset'
import ourFetch from '@/shared/utils/ourFetch'
import React, {
  ChangeEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import DataTable, { Media, TableColumn } from 'react-data-table-component'
import { useNavigate } from 'react-router-dom'
import Select, { MultiValue } from 'react-select'
import './wishlist.scss'
import { Dropdown } from 'react-bootstrap'
import encryptData from '@/shared/utils/encrypt'
import Carousel from 'react-bootstrap/Carousel'

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

  const cancelRequest = useRef<CancelTokenSource | null>(null)

  const caseInsensitiveSort = (rowA: any, rowB: any) => {
    const a = rowA.title.toLowerCase()
    const b = rowB.title.toLowerCase()

    if (a > b) {
      return 1
    }

    if (b > a) {
      return -1
    }

    return 0
  }

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
      grow: 2,
      wrap: true,
    },
    {
      name: 'Author',
      selector: (row) => row.author,
      grow: 1,
      wrap: true,
    },
    {
      name: 'Category',
      selector: (row) => row.category,
      grow: 1,
      sortable: true,
      wrap: true,
      hide: 'sm' as Media,
      sortFunction: caseInsensitiveSort,
      sortField: 'category',
    },
    {
      name: 'Recent Request',
      selector: (row) => row.lastVoted,
      grow: 1.2,
      sortable: true,
      wrap: true,
      hide: 'md' as Media,
      sortField: 'updated_at',
    },
    {
      name: 'Votes',
      selector: (row) => row.votes,
      grow: 0,
      sortable: true,
      sortField: 'votes',
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

  const itemsPerPage = 5 // Change this as per your requirements

  // Calculate the total number of slides for videosAI
  const totalVideoSlides = Math.ceil(videoCardsComponents.length / itemsPerPage)

  // Initialize active slide state
  const [activeVideoSlide, setActiveVideoAISlide] = useState(0)

  // Function to handle slide change for videosAI
  const handleVideoSlideChange = (selectedIndex: number) => {
    setActiveVideoAISlide(selectedIndex)
    // // Check if there are videos in the next slide
    // if (selectedIndex < totalVideoAISlides - 1) {
    //   setHasNextVideos(true)
    // } else {
    //   setHasNextVideos(false)
    // }

    // // Check if there are videos in the previous slide
    // if (selectedIndex > 0) {
    //   setHasPreviousVideos(true)
    // } else {
    //   setHasPreviousVideos(false)
    // }
  }

  const describeThisVideo = (youTubeId: string) => {
    if (userDataStore.getState().isSignedIn) {
      axios
        .post(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/create-new-user-ad`,
          {
            youtubeVideoId: youTubeId,
          },
          {
            withCredentials: true,
          },
        )
        .then((res) => {
          if (res.status != 201) {
            alert(
              translate(
                'Something went wrong or you may already have described this video. Please try again later!',
              ),
            )
            return
          }
          navigate('/editor/' + res.data.url)
        })
    } else {
      alert(
        translate('You have to be logged in in order to describe this video'),
      )
    }
  }
  function renderCarouselIndicators(totalSlides: number, activeSlide: number) {
    return (
      <ol className="carousel-indicators">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <li
            key={index}
            onClick={() => setActiveVideoAISlide(index)}
            className={index === activeSlide ? 'active' : ''}
          ></li>
        ))}
      </ol>
    )
  }
  // // Slice the videosAI array to display only the videos for the active page
  // const videosAIToDisplay = videosAI.slice(videoAIStartIndex, videoAIEndIndex)
  // console.log({ videosAIToDisplay })
  // Calculate the range of videos to display on the current slide
  const videoStartIndex = activeVideoSlide * itemsPerPage
  const videoEndIndex = videoStartIndex + itemsPerPage

  const videosToDisplay = videoCardsComponents.slice(
    videoStartIndex,
    videoEndIndex,
  )

  useEffect(() => {
    document.title = translate('YouDescribe - Wish List')
    loadTableVideos(currentPageNumber, perPage)
    loadTopVideos()
  }, [userDataStore.getState().userId])

  /*
    Loads data for the table using the /wishlist/search endpoint
    The endpoint requires the following query parameters
      - page: The page number to be fetched
      - perPage: Number of items to be displayed on each page
      - search: The search string to be passed (joined with the %20 separator)
      - category: The list of categories that the search should be filtered by. Each category is comma separated and joined with the %20 separator.
  */
  const loadTableVideos = (
    pageNumber: number,
    rowsPerPage: number,
    column = '',
    sortDirection = '',
  ) => {
    const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/wishlist/get-all-wishlist`
    axios
      .post(
        url,
        {
          page: pageNumber,
          limit: rowsPerPage,
          search: search,
          category: selectedCategories,
          sortField: column,
          sort: sortDirection,
        },
        {
          withCredentials: true,
        },
      )
      .then((response) => {
        const wishListItems = response.data.data
        setTotalRows(response.data.totalItems)
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
        console.log(err)
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
    console.log('YT Response', youTubeResponse)
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
    console.log(rows)
  }

  const loadTopVideos = () => {
    const url = `${apiUrl}/wishlist/top/`
    // console.log(userDataStore.getState())
    if (cancelRequest.current) {
      cancelRequest.current.cancel()
    }
    cancelRequest.current = axios.CancelToken.source()
    axios
      .get(url, {
        withCredentials: true,
        headers: {
          authorization: encryptData(userDataStore.getState().userId),
        },
        cancelToken: cancelRequest.current.token,
      })
      .then((response) => {
        // console.log('response')
        // console.log(response.data.result)
        const wishListItems = response.data.result
        const topYouTubeIds = []
        const topYouDescribeIds = []
        const topVotes = []
        const votedArr = []
        for (let i = 0; i < wishListItems.length; i += 1) {
          topYouTubeIds.push(wishListItems[i].youtube_id)
          topYouDescribeIds.push(wishListItems[i]._id)
          topVotes.push(wishListItems[i].votes)
          votedArr.push({
            id: wishListItems[i]._id,
            voted: wishListItems[i].voted,
          })
        }
        return { topYouTubeIds, topYouDescribeIds, topVotes, votedArr }
      })
      .then(({ topYouTubeIds, topYouDescribeIds, topVotes, votedArr }) => {
        const url = `${apiUrl}/videos/getyoutubedatafromcache?youtubeids=${topYouTubeIds.join(
          ',',
        )}&key=wishlist`
        ourFetch(url).then((response) => {
          parseFetchedData(
            JSON.parse(response.result),
            topYouDescribeIds,
            topYouTubeIds,
            topVotes,
            votedArr,
          )
        })
      })
  }

  const parseFetchedData = (
    youTubeResponse: any,
    topYouDescribeIds: any,
    topYouTubeIds: any,
    topVotes: any,
    votedArr: any,
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
      console.log('votes', item)
      const voted = votedArr[i].voted
      console.log('voteds', votedArr[i])

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
            userVote={voted}
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
      <div className="w3-row-padding classic-container w3-margin-top most-requested-title">
        Top 5 Most Requested Videos
      </div>
      <div className="w3-row-padding classic-container wishlist-video-row">
        {videoCardsComponents}
      </div>
      <header className="w3-container w3-indigo">
        <h2 className="classic-h2">{translate('MY WISHLIST')}</h2>
      </header>
      <div className="d-flex justify-content-center custom-carousel">
        {videosToDisplay.length > 0 && ( // Check if there are videos to display
          <>
            {/* Custom previous button */}
            <button
              className="prev-icon"
              onClick={() => handleVideoSlideChange(activeVideoSlide - 1)}
              disabled={activeVideoSlide === 0}
            >
              &lt;
            </button>

            {/* Content for displaying videos */}
            <div className="w3-row classic-container row">
              {videosToDisplay}
            </div>
            {renderCarouselIndicators(totalVideoSlides, activeVideoSlide)}

            {/* Custom next button */}
            <button
              className="next-icon"
              onClick={() => handleVideoSlideChange(activeVideoSlide + 1)}
              disabled={activeVideoSlide === totalVideoSlides - 1}
            >
              &gt;
            </button>
          </>
        )}

        {videosToDisplay.length === 0 && (
          <p className="history-text">No history to view.</p>
        )}
      </div>
      <form
        onSubmit={(e: any) => {
          e.preventDefault()
          loadTableVideos(0, perPage)
        }}
      >
        <div className="w3-row-padding classic-container search-container">
          <span className="category-label">Category</span>
          <div className="category-select">
            <Select
              options={allCategories.map((category) => {
                const option = { value: category, label: category }
                if (category === 'How-To & Style') {
                  option.value = 'Howto & Style'
                }
                return option
              })}
              placeholder="All"
              isMulti
              onChange={handleCategoryChange}
            />
          </div>
          <span className="search-label">Wishlist Search</span>
          <input
            type="text"
            placeholder="Search Wishlist"
            className="search-input"
            value={search}
            onChange={handleChange}
          />
        </div>
        <div className="search-button-container">
          <button
            className="w3-btn w3-indigo search-button"
            onClick={() => loadTableVideos(0, perPage)}
            type="submit"
          >
            Search
          </button>
        </div>
      </form>
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
          onSort={(column, direction) =>
            loadTableVideos(0, perPage, column.sortField, direction)
          }
          sortServer
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
