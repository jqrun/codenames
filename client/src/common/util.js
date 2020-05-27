const NUM_INSTANCES = 1;
const DEV_SERVER_URL = 'http://penguin.linux.test:8080'
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const isDev = !IS_PRODUCTION;

export function getFetchUrl(roomId, path, params) {
  const base = getServerUrl(roomId);
  return `${base}${path}${getQueryParams(params)}`;
}

function getServerUrl(roomId) {
  if (!IS_PRODUCTION) return DEV_SERVER_URL;

  const numerical = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const instance = (numerical % NUM_INSTANCES);
  return `https://${instance}-dot-1-default-dot-codenames-273814.uc.r.appspot.com`;
}
export {getServerUrl};

export function getQueryParams(params) {
  return '?' + Object.entries(params).map(([key, value]) => 
    `${key}=${value}`
  ).join('&');
}