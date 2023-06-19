const getLanguage = (): 'en-us' | 'pt-br' => {
  let defaultLang = 'en-us'
  if (navigator.languages != undefined) {
    defaultLang = navigator.languages[0]
  } else {
    defaultLang = navigator.language
  }
  if (defaultLang.toLowerCase() === 'pt-br') {
    return 'pt-br'
  }
  return 'en-us'
}

export default getLanguage
