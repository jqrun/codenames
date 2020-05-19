const DEV_SERVER_URL = 'http://penguin.linux.test:8080'
const HOST = window.location.host;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROD_SERVER_URL = 'https://codenames-273814.uc.r.appspot.com';

export const serverUrl = IS_PRODUCTION ? PROD_SERVER_URL : DEV_SERVER_URL;