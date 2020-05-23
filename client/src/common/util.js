const DEV_SERVER_URL = 'http://penguin.linux.test:8080'
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROD_SERVER_URL = 'https://codenames-273814.uc.r.appspot.com';

export const isDev = !IS_PRODUCTION;
export const serverUrl = IS_PRODUCTION ? PROD_SERVER_URL : DEV_SERVER_URL;

// Extremely dumb cipher just to discourage cheating the game by looking at the network tab.
export function decrypt(data) {
  return JSON.parse(data.map(chunk => String.fromCharCode(chunk / 3)).join(''));
} 