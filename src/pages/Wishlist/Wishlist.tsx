import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import Spinner from 'react-bootstrap/Spinner'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl } from '@/shared/config'
import axios, { CancelTokenSource } from 'axios'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
// import getTimeZoneOffset from '@/shared/utils/getTimeZoneOffset'
import ourFetch from '@/shared/utils/ourFetch'
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react'
import DataTable, { Media, TableColumn } from 'react-data-table-component'
import { useNavigate } from 'react-router-dom'
import Select, { MultiValue } from 'react-select'
import './wishlist.scss'
import { toast } from 'react-toastify'

interface VideosState {
  data: any[]
  totalVideos: number
  totalPages: number
  currentPage: number
  videoComponentData: any[]
}

type SetVideosData = React.Dispatch<React.SetStateAction<VideosState | null>>

type DataState = VideosState | null

type FetchVideosDataFunction = (
  dataState: DataState,
  setVideoLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
) => Promise<void>

const CustomButton = ({
  className,
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  className: string
  disabled: boolean
  children: React.ReactNode
}) => {
  const buttonStyle: React.CSSProperties = {
    opacity: disabled ? '50%' : '100%',
  }

  const handleHover = (event: any) => {
    if (!disabled) {
      // Add your custom hover style changes here
      event.target.style.cursor = 'pointer'
      // Other hover effects
    } else {
      event.target.style.cursor = 'not-allowed'
    }
  }

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      onMouseOver={handleHover}
    >
      {children}
    </button>
  )
}

const CustomSpinner = () => (
  <div className="d-flex justify-content-between align-items-center h-100 h-100">
    <div className="w3-row classic-container row">
      <Spinner
        animation="border"
        role="status"
        style={{
          margin: 'auto',
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  </div>
)

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
  const [wishlistData, setWishlistData] = useState<VideosState | null>(null)
  const [showWishlistSpinner, setShowWishlistSpinner] = useState(true)
  // const [youTubeIds, setYouTubeIds] = useState<string[]>([])
  // const [youDescribeIds, setYouDescribeIds] = useState<string[]>([])
  // const [votes, setVotes] = useState<number[]>([])
  // const [updatedAt, setUpdatedAt] = useState<string[]>([])
  // const [categories, setCategories] = useState<string[]>([])
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
      grow: 1.5,
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
      name: 'AI Descriptions',
      cell: (row) => (row.aiRequested ? 'Available' : 'Not Available'),
      grow: 1.5,
      sortable: true,
      wrap: true,
      sortField: 'AI-Descriptions',
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

  const fetchVideoDetails = async (videoIds: string[]) => {
    try {
      // Your logic for fetching video details goes here
      // Make sure to handle errors appropriately
      const url = `${apiUrl}/videos/getyoutubedatafromcache?youtubeids=${videoIds.join(
        ',',
      )}&key=wishlist`
      const response = await ourFetch(url)
      return JSON.parse(response.result)
    } catch (error) {
      console.error('Error fetching video details:', error)
      throw error // Rethrow the error for handling in the calling function
    }
  }

  const fetchAndSetWishlistData: FetchVideosDataFunction = async (
    dataState,
    setLoadingState,
  ) => {
    const pageNumber = dataState?.currentPage || 1

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/wishlist/get-user-wishlist`,
        {
          params: {
            pageNumber: pageNumber,
          },
          withCredentials: true,
        },
      )

      // console.log('==============================')
      // console.log(response.data)
      // console.log('==============================')

      const totalVideosLength = response.data.totalVideos
      const calculatedTotalVideoPages = Math.ceil(
        totalVideosLength / itemsPerPage,
      )
      const wishListItems = response.data.result
      const topYouTubeIds = []
      const topYouDescribeIds = []
      const topVotes = []
      const votedArr = []
      const aiReq = []

      for (let i = 0; i < wishListItems.length; i += 1) {
        topYouTubeIds.push(wishListItems[i].youtube_id)
        topYouDescribeIds.push(wishListItems[i]._id)
        topVotes.push(wishListItems[i].votes)
        aiReq.push(wishListItems[i].aiRequested)
        votedArr.push({
          id: wishListItems[i]._id,
          voted: wishListItems[i].votes,
        })
      }

      // console.log('topYouTubeIds', topYouTubeIds)
      const youTubeResponse = await fetchVideoDetails(topYouTubeIds)
      // console.log('youTubeResponse', youTubeResponse)
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
        const views = convertViewsToCardFormat(
          Number(item.statistics.viewCount),
        )
        const publishedAt = new Date(item.snippet.publishedAt)
        const now = Date.now()
        const votes = topVotes[i]
        const aiRequested = aiReq[i]
        const time = convertTimeToCardFormat(
          Number(now - publishedAt.getMilliseconds()),
        )

        const voted = votedArr[i].voted
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
              userVote={true}
              aiRequested={aiRequested}
            />
          </div>,
        )
      }
      // console.log('videoCardsComponents', videoCardsComponents)
      const newWishlistData = {
        data: videoCardsComponents,
        totalVideos: videoCardsComponents.length,
        totalPages: calculatedTotalVideoPages,
        currentPage: pageNumber,
        videoComponentData: videoCardsComponents,
      }

      setWishlistData(newWishlistData)

      setLoadingState(false)
    } catch (error) {
      console.error('Error fetching and setting wish list data:', error)
      // Handle the error as needed
    }
  }

  const handleNextPage = (
    currentDataState: VideosState | null,
    setVideoLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!currentDataState) return
    fetchAndSetWishlistData(
      {
        ...currentDataState,
        currentPage: Math.min(
          currentDataState.currentPage + 1,
          currentDataState.totalPages,
        ),
      },
      setVideoLoadingState,
    )
  }

  const handlePreviousPage = (
    currentDataState: VideosState | null,
    setVideoLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!currentDataState) return
    fetchAndSetWishlistData(
      {
        ...currentDataState,
        currentPage: Math.max(currentDataState.currentPage - 1, 1),
      },

      setVideoLoadingState,
    )
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
            // toast.error(
            //   translate(
            //     'Something went wrong or you may already have described this video. Please try again later!',
            //   ),
            toast.error(
              translate(
                'Something went wrong or you may already have described this video. Please try again later!',
              ),
            )

            return
          }

          navigate('/video/' + youTubeId)
        })
    } else {
      // toast.error(
      //   translate('You have to be logged in in order to describe this video'),
      // )
      toast.error(
        translate('You have to be logged in in order to describe this video'),
      )
    }
  }

  useEffect(() => {
    document.title = translate('YouDescribe - Wish List')
    loadTableVideos(currentPageNumber, perPage)
    loadTopVideos()
    fetchAndSetWishlistData(wishlistData, setShowWishlistSpinner)
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
        // const wishListItems = responseData.data
        // setTotalRows(responseData.totalItems)
        const youTubeIds = []
        const youDescribeIds = []
        const votes = []
        const updatedAt = []
        const categories = []
        const aiRequested = []
        for (let i = 0; i < wishListItems.length; i += 1) {
          youTubeIds.push(wishListItems[i].youtube_id)
          youDescribeIds.push(wishListItems[i]._id)
          votes.push(wishListItems[i].votes)
          updatedAt.push(wishListItems[i].updated_at)
          categories.push(wishListItems[i].category)
          aiRequested.push(wishListItems[i].aiRequested)
        }
        // setYouTubeIds(youTubeIds)
        // setYouDescribeIds(youDescribeIds)
        // setVotes(votes)
        // setUpdatedAt(updatedAt)
        // setCategories(categories)
        return { youTubeIds, votes, categories, updatedAt, aiRequested }
      })
      .then(({ youTubeIds, votes, categories, updatedAt, aiRequested }) => {
        const url = `${
          process.env.REACT_APP_YDX_BACKEND_URL
        }/api/videos/getyoutubedatafromcache?youtubeids=${youTubeIds.join(
          ',',
        )}&key=wishlist`
        ourFetch(url).then((response) => {
          // console.log(response)
          parseTableData(
            response.result,
            votes,
            categories,
            updatedAt,
            aiRequested,
          )
        })
      })
      .catch((err) => {
        // console.log(err)
        setTotalRows(0)
        setRows([])
      })
  }

  const parseTableData = (
    youTubeResponse: any,
    votes: any,
    categories: any,
    updatedAt: any,
    aiRequested: any,
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
      const aiReq = aiRequested[i]

      rows.push({
        title: title,
        votes: votesCount,
        author: author,
        youTubeId: youTubeId,
        thumbnail: thumbnailMedium,
        lastVoted: diffToLastUpdate,
        category: category,
        aiRequested: aiReq,
      })
    }
    setRows(rows)
  }

  const loadTopVideos = () => {
    const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/wishlist/get-top-wishlist`
    // // console.log(userDataStore.getState())
    if (cancelRequest.current) {
      cancelRequest.current.cancel()
    }
    cancelRequest.current = axios.CancelToken.source()
    axios
      .get(url, {
        withCredentials: true,
        cancelToken: cancelRequest.current.token,
      })
      .then((response) => {
        const wishListItems = response.data
        // console.log(wishListItems)
        const topYouTubeIds = []
        const topYouDescribeIds = []
        const topVotes = []
        const votedArr = []
        const aiReq = []
        for (let i = 0; i < wishListItems.length; i += 1) {
          topYouTubeIds.push(wishListItems[i].youtube_id)
          topYouDescribeIds.push(wishListItems[i]._id)
          topVotes.push(wishListItems[i].votes)
          aiReq.push(wishListItems[i].aiRequested)
          votedArr.push({
            id: wishListItems[i]._id,
            voted: wishListItems[i].voted,
          })
        }
        return { topYouTubeIds, topYouDescribeIds, topVotes, votedArr, aiReq }
      })
      .then(
        ({ topYouTubeIds, topYouDescribeIds, topVotes, votedArr, aiReq }) => {
          const url = `${
            process.env.REACT_APP_YDX_BACKEND_URL
          }/api/videos/getyoutubedatafromcache?youtubeids=${topYouTubeIds.join(
            ',',
          )}&key=wishlist`
          ourFetch(url).then((response) => {
            parseFetchedData(
              response.result,
              topYouDescribeIds,
              topYouTubeIds,
              topVotes,
              votedArr,
              aiReq,
            )
          })
        },
      )
  }

  const parseFetchedData = (
    youTubeResponse: any,
    topYouDescribeIds: any,
    topYouTubeIds: any,
    topVotes: any,
    votedArr: any,
    aiReq: any,
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
      const aiRequested = aiReq[i]
      const time = convertTimeToCardFormat(
        Number(now - publishedAt.getMilliseconds()),
      )
      const voted = votedArr[i]?.voted

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
            votes={votes?.voted}
            buttons="upvote-describe"
            userVote={voted}
            aiRequested={aiRequested}

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
          {translate('WISHLIST')}
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
        {userDataStore.getState().isSignedIn ? (
          <h2 className="classic-h2">{translate('MY WISHLIST')}</h2>
        ) : (
          <h2 className="classic-h2">{translate('WISHLIST')}</h2>
        )}
      </header>

      {userDataStore.getState().isSignedIn && (
        <div className="d-flex justify-content-center custom-carousel">
          <div className="custom-carousel">
            {!wishlistData && <CustomSpinner />}
            {wishlistData && wishlistData?.data.length > 0 && (
              <div className="d-flex justify-content-between align-items-center h-100">
                {/* Custom previous button */}
                <CustomButton
                  className="prev-wishlist-icon"
                  onClick={async () => {
                    setShowWishlistSpinner(true) // Optionally, show spinner while loading
                    await handlePreviousPage(
                      wishlistData,
                      setShowWishlistSpinner,
                    )
                    setShowWishlistSpinner(false) // Optionally, hide spinner after loading
                  }}
                  disabled={wishlistData.currentPage === 1}
                >
                  &lt;
                </CustomButton>

                {/* Content for displaying videos */}
                <div className="w3-row classic-container wishlist-video-row ">
                  {wishlistData.data}
                </div>

                {/* Custom next button */}
                <CustomButton
                  className="next-wishlist-icon"
                  onClick={async () => {
                    setShowWishlistSpinner(true) // Optionally, show spinner while loading
                    await handleNextPage(wishlistData, setShowWishlistSpinner)
                    setShowWishlistSpinner(false) // Optionally, hide spinner after loading
                  }}
                  disabled={
                    wishlistData.currentPage === wishlistData.totalPages
                  }
                >
                  &gt;
                </CustomButton>
              </div>
            )}

            {wishlistData?.data.length === 0 && (
              <p className="history-text">No videos in your wishlist.</p>
            )}
          </div>
        </div>
      )}
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
