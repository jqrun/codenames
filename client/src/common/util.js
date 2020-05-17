const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROD_SERVER_URL = 'https://us-central1-codenames-273814.cloudfunctions.net/server';
const DEV_SERVER_URL = 'http://localhost:5001/codenames-273814/us-central1/server'
const HOST = window.location.host;

export const serverUrl = IS_PRODUCTION ? PROD_SERVER_URL : DEV_SERVER_URL;

export const getWebsocketUrl = roomId => `ws${IS_PRODUCTION ? 's': ''}://${HOST}/${roomId}`;
