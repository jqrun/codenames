// Extremely dumb cipher just to discourage cheating the game by looking at the network tab.
module.exports.encrypt = (data) => {
  return JSON.stringify(data).split('').map(char => char.charCodeAt(0) * 3);
} 