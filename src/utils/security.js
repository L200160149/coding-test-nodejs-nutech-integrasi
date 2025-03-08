import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

const encryptionKey = process.env.ENCRYPTION_KEY;

const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
};

const decryptData = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, encryptionKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

export { encryptData, decryptData };
