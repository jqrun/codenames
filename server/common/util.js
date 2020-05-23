// Extremely dumb cipher just to discourage cheating the game by looking at the network tab.
module.exports.encrypt = (data) => {
  return JSON.stringify(data).split('').map(char => {
    let charCode = char.charCodeAt(0) + 5;
    charCode = charCode > 127 ? 31 + (charCode - 126) : charCode;
    return String.fromCharCode(charCode);
  }).join('');
} 