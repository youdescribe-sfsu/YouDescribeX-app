import axios from 'axios'

export const requestAiDescriptionWithLana = async (
  youtubeId: string,
  userId: string,
) => {
  const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/ai/description/lana`
  return axios.post(
    url,
    { youtube_id: youtubeId, user_id: userId },
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}
