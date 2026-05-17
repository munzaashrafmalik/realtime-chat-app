// Encryption utility using Web Crypto API for end-to-end encryption

const ENCRYPTION_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256'
};

// Generate RSA key pair
export const generateKeyPair = async () => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      ENCRYPTION_ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );

    return keyPair;
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
};

// Export public key to string format
export const exportPublicKey = async (publicKey) => {
  try {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    const exportedAsString = arrayBufferToBase64(exported);
    return exportedAsString;
  } catch (error) {
    console.error('Error exporting public key:', error);
    throw error;
  }
};

// Export private key to string format
export const exportPrivateKey = async (privateKey) => {
  try {
    const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    const exportedAsString = arrayBufferToBase64(exported);
    return exportedAsString;
  } catch (error) {
    console.error('Error exporting private key:', error);
    throw error;
  }
};

// Import public key from string format
export const importPublicKey = async (publicKeyString) => {
  try {
    const binaryDer = base64ToArrayBuffer(publicKeyString);
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      ENCRYPTION_ALGORITHM,
      true,
      ['encrypt']
    );
    return publicKey;
  } catch (error) {
    console.error('Error importing public key:', error);
    throw error;
  }
};

// Import private key from string format
export const importPrivateKey = async (privateKeyString) => {
  try {
    const binaryDer = base64ToArrayBuffer(privateKeyString);
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      ENCRYPTION_ALGORITHM,
      true,
      ['decrypt']
    );
    return privateKey;
  } catch (error) {
    console.error('Error importing private key:', error);
    throw error;
  }
};

// Encrypt message using recipient's public key
export const encryptMessage = async (message, publicKeyString) => {
  try {
    const publicKey = await importPublicKey(publicKeyString);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );

    return arrayBufferToBase64(encrypted);
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw error;
  }
};

// Decrypt message using own private key
export const decryptMessage = async (encryptedMessage, privateKeyString) => {
  try {
    const privateKey = await importPrivateKey(privateKeyString);
    const data = base64ToArrayBuffer(encryptedMessage);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
};

// Store keys in localStorage (private key should be encrypted in production)
export const storeKeys = (publicKey, privateKey) => {
  try {
    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('privateKey', privateKey);
  } catch (error) {
    console.error('Error storing keys:', error);
    throw error;
  }
};

// Retrieve keys from localStorage
export const getStoredKeys = () => {
  try {
    const publicKey = localStorage.getItem('publicKey');
    const privateKey = localStorage.getItem('privateKey');
    return { publicKey, privateKey };
  } catch (error) {
    console.error('Error retrieving keys:', error);
    return { publicKey: null, privateKey: null };
  }
};

// Clear stored keys
export const clearStoredKeys = () => {
  try {
    localStorage.removeItem('publicKey');
    localStorage.removeItem('privateKey');
  } catch (error) {
    console.error('Error clearing keys:', error);
  }
};

// Helper: Convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer) => {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
};

// Helper: Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Check if encryption is supported
export const isEncryptionSupported = () => {
  return window.crypto && window.crypto.subtle;
};

// Generate and store new key pair
export const initializeEncryption = async () => {
  try {
    if (!isEncryptionSupported()) {
      throw new Error('Encryption not supported in this browser');
    }

    const keyPair = await generateKeyPair();
    const publicKeyString = await exportPublicKey(keyPair.publicKey);
    const privateKeyString = await exportPrivateKey(keyPair.privateKey);

    storeKeys(publicKeyString, privateKeyString);

    return { publicKey: publicKeyString, privateKey: privateKeyString };
  } catch (error) {
    console.error('Error initializing encryption:', error);
    throw error;
  }
};
