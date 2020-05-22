const hridWords = require('../assets/human_readable_id_words.json');

const DEV_SERVER_URL = 'http://penguin.linux.test:8080'
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROD_SERVER_URL = 'https://codenames-273814.uc.r.appspot.com';

export const isDev = !IS_PRODUCTION;
export const serverUrl = IS_PRODUCTION ? PROD_SERVER_URL : DEV_SERVER_URL;

export function generateRandomId() {
  const adjectives = hridWords.adjectives;
  const nouns = hridWords.nouns;

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 10);

  return`${randomAdjective}-${randomNoun}-${randomNumber}`;
}