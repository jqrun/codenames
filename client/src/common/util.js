const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const isDev = !IS_PRODUCTION;

export function getFetchUrl(roomId, path, params) {
  const base = getServerUrl(roomId);
  return `${base}${path}${getQueryParams(params)}`;
}

export function getQueryParams(params) {
  return '?' + Object.entries(params).map(([key, value]) => 
    `${key}=${value}`
  ).join('&');
}

function getServerUrl(roomId) {
  if (!IS_PRODUCTION) return  process.env.REACT_APP_LOCAL_FUNCTIONS_URL;
  return process.env.REACT_APP_PROD_FUNCTIONS_URL;
}