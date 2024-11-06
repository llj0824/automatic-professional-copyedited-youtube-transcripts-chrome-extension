class EncryptionUtils {
  static encryptString(plaintext, key = 'assoonasigetusersthisisgoingtobeabackendserverandyoucantstealmykeyanymoreha') {
    let encrypted = '';
    for (let i = 0; i < plaintext.length; i++) {
      const charCode = plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += charCode.toString(16).padStart(2, '0');
    }
    return encrypted;
  }

  static decryptString(encryptedHex, key = 'assoonasigetusersthisisgoingtobeabackendserverandyoucantstealmykeyanymoreha') {
    const encrypted = encryptedHex.match(/.{2}/g)
      .map(hex => String.fromCharCode(parseInt(hex, 16)))
      .join('');

    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  }
}

export default EncryptionUtils; 