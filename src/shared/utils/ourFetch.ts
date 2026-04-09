interface Response {
  code: number
  message: string
  result: any
  status: number
  type: string
}

const safeParseJson = (payload: string | null) => {
  if (!payload) return null

  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

const ourFetch = (
  url: string,
  JSONparsing = true,
  optionObj: {
    method: 'GET' | 'POST' | 'DELETE' | 'PUT'
    headers?: { [key: string]: string }
    body?: any
  } = {
    method: 'GET',
  },
): Promise<Response> => {
  return new Promise<Response>((resolve, reject) => {
    const req = new XMLHttpRequest()

    // Check if the URL is absolute
    const absoluteUrl = new URL(url, window.location.origin)
    console.log('Absolute URL:', absoluteUrl.toString())

    req.open(optionObj.method, absoluteUrl.toString())

    if (optionObj.headers) {
      for (const key in optionObj.headers) {
        req.setRequestHeader(key, optionObj.headers[key])
      }
    }

    req.onload = () => {
      if (req.status === 200) {
        if (JSONparsing) {
          const parsedResponse = safeParseJson(req.response)
          if (parsedResponse === null) {
            reject({
              code: req.status,
              status: req.status,
              type: req.getResponseHeader('content-type') || 'unknown',
              message: 'Invalid JSON response from server',
              result: req.response,
            })
            return
          }
          resolve(parsedResponse)
        } else {
          resolve(req.response)
        }
      } else {
        const parsedError = safeParseJson(req.response)
        reject(
          parsedError || {
            code: req.status,
            status: req.status,
            type: req.getResponseHeader('content-type') || 'unknown',
            message: req.statusText || 'Request failed',
            result: req.response,
          },
        )
      }
    }

    req.onerror = (error) => {
      console.error('XHR error:', error)
      reject(new Error('Network error occurred'))
    }

    req.send(optionObj.body)
    console.log('XHR request sent')
  })
}

export default ourFetch
