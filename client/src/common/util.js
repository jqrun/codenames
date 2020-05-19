const DEV_SERVER_URL = 'http://localhost:5001/codenames-273814/us-central1/server'
const HOST = window.location.host;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROD_SERVER_URL = 'https://us-central1-codenames-273814.cloudfunctions.net/server';

export const serverUrl = IS_PRODUCTION ? PROD_SERVER_URL : DEV_SERVER_URL;