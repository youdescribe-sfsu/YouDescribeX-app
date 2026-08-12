import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor, within } from '@testing-library/react'
import axios from 'axios'
import AiDrafts from './AiDrafts'
import YouTubeService from '../../shared/utils/YouTubeService'

jest.mock('axios')

jest.mock('../../shared/components/VideoCard/VideoCard', () => ({
  __esModule: true,
  default: ({
    title,
    author,
    previewUrl,
    thumbnailMediumUrl,
  }: {
    title: string
    author: string
    previewUrl: string
    thumbnailMediumUrl: string
  }) => (
    <article>
      <h3>
        <a href={previewUrl}>{title}</a>
      </h3>
      <p>{author}</p>
      <a href={previewUrl}>
        <img src={thumbnailMediumUrl} alt={title} />
      </a>
    </article>
  ),
}))

jest.mock('../../shared/utils/YouTubeService', () => ({
  __esModule: true,
  default: {
    getVideoDetails: jest.fn(),
  },
}))

jest.mock('../../shared/components/Spinner/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading AI drafts</div>,
}))

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedYouTubeService = YouTubeService as jest.Mocked<
  typeof YouTubeService
>

describe('AiDrafts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders public AI drafts with links to the selected description', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        result: [
          {
            audio_description_id: 'audio-description-123',
            video_id: 'video-123',
            youtube_id: 'youtube123',
            video_name: 'Fallback title',
            createdAt: 20260812000000,
            updatedAt: 20260812000000,
            status: 'draft',
            admin_review: false,
          },
        ],
        totalVideos: 1,
      },
    })

    mockedYouTubeService.getVideoDetails.mockResolvedValue([
      {
        id: 'youtube123',
        snippet: {
          title: 'Mock AI Draft Video',
          channelTitle: 'Mock Channel',
          thumbnails: {
            medium: {
              url: 'https://example.com/thumbnail.jpg',
              width: 320,
              height: 180,
            },
          },
        },
        contentDetails: {
          duration: 'PT2M30S',
        },
      },
    ])

    render(
      <MemoryRouter>
        <AiDrafts />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading AI drafts')).toBeInTheDocument()

    expect(
      await screen.findByRole('heading', {
        name: 'Mock AI Draft Video',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText(/Mock Channel/)).toBeInTheDocument()

    const videoHeading = screen.getByRole('heading', {
      name: 'Mock AI Draft Video',
    })

    const titleLink = within(videoHeading).getByRole('link')
    expect(titleLink).toHaveAttribute(
      'href',
      '/video/youtube123?ad=audio-description-123',
    )

    const thumbnail = screen.getByAltText('Mock AI Draft Video')
    expect(thumbnail.closest('a')).toHaveAttribute(
      'href',
      '/video/youtube123?ad=audio-description-123',
    )

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/audio-descriptions/get-All-AI-descriptions',
        ),
        {
          params: {
            pageNumber: 1,
          },
        },
      )
    })
  })
})
