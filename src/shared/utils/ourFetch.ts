import { apiUrl } from '../config' // Xiao: import the apiUrl from the config file

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
    timeoutMs?: number
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

    // xiao: send session cookie only to YDX backend; third-party domains (googleapis) reject credentialed requests via CORS
    req.withCredentials = absoluteUrl.origin === new URL(apiUrl).origin

    req.timeout = optionObj.timeoutMs ?? 15000

    req.ontimeout = () => {
      reject(new Error(`Request timed out after ${req.timeout}ms: ${url}`))
    }

    if (optionObj.headers) {
      for (const key in optionObj.headers) {
        req.setRequestHeader(key, optionObj.headers[key])
      }
    }

    req.onload = () => {
      if (req.status === 200) {
        if (JSONparsing) {
          try {
            resolve(JSON.parse(req.response))
          } catch {
            reject(new Error(`Invalid JSON response from ${url}`))
          }
        } else {
          resolve(req.response)
        }
      } else {
        // xiao: notify app of session expiration — ourFetch bypasses the axios interceptor
        if (req.status === 401) {
          window.dispatchEvent(new CustomEvent('ydx:unauthorized'))
        }
        try {
          reject(JSON.parse(req.response))
        } catch {
          reject(new Error(`HTTP ${req.status}: ${req.statusText || 'Error'}`))
        }
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
