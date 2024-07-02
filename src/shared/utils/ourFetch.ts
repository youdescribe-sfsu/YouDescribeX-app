interface Response {
  code: number
  message: string
  result: any
  status: number
  type: string
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

    req.open(optionObj.method, absoluteUrl.toString())

    if (optionObj.headers) {
      for (const key in optionObj.headers) {
        req.setRequestHeader(key, optionObj.headers[key])
      }
    }

    req.onload = () => {
      if (req.status === 200) {
        if (JSONparsing) {
          resolve(JSON.parse(req.response))
        } else {
          resolve(req.response)
        }
      } else {
        reject(JSON.parse(req.response))
      }
    }

    req.onerror = () => {
      reject(new Error('Network error occurred'))
    }

    req.send(optionObj.body)
  })
}

export default ourFetch
