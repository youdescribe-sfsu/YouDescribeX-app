const ourFetch = (
  url: string,
  JSONparsing = true,
  optionObj: {
    method: 'GET' | 'POST' | 'DELETE ' | 'PUT'
    headers?: { [key: string]: string }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
  } = {
    method: 'GET',
  },
) => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open(optionObj.method, url)
    if (optionObj.headers) {
      for (const key in optionObj.headers) {
        req.setRequestHeader(key, optionObj.headers[key])
      }
    }

    /* used for visit counter */
    // if (!sessionStorage.getItem("visit")) {
    //   sessionStorage.setItem("visit", Date.now());
    // }
    // req.setRequestHeader("Visit", sessionStorage.getItem("visit"));
    /* end of used for visit counter */

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
    req.send(optionObj.body)
  })
}

export default ourFetch
