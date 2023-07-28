import CryptoJS from 'crypto-js'

const encryptData = (userDataString: string) =>
  CryptoJS.AES.encrypt(
    userDataString,
    '8c628449c5102aeabd49b5dc3a2a516ea6',
  ).toString()

export default encryptData
