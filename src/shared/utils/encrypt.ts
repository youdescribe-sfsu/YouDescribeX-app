import CryptoJS from 'crypto-js'

const encryptData = (userDataString: string) => {
  console.log('userDataString', userDataString)
  const encryptedData: string = CryptoJS.AES.encrypt(
    userDataString,
    '050cf42ee14d597188b0695a94df5e866d7eda5d06af32ff3ac329ddbcf7ca8a',
  ).toString()
  console.log('encryptedData::', encryptedData)
  return encryptedData
}

export default encryptData
