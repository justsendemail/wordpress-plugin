
function wpClient(endpoint, {body, ...customConfig} = {}) {

  const delayed = (value) => new Promise(resolve => setTimeout(() => {resolve(value);}, 1000))

  const headers = {'Content-Type': 'application/json'}
  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      'X-WP-Nonce': __JSECNCT.api.nonce,
      ...customConfig.headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  if(__JSECNCT.api.wpApiUrl === 'mock') {
    if(endpoint === 'available') {
      return delayed({
        sendy_url_configured: false,
        sendy_api_configured: false,
        woocommerce: true,
        amelia: false,
        forminator: false
      });
      } else if(endpoint === 'settings') {
      return delayed({
        sendyListId: "ListIDMock",
        woocommerce: {active: true},
        amelia: {active: true},
        forminator: {active: false}
      });
    } else {
      return delayed({})
    }
  }

  return window
    .fetch(`${__JSECNCT.api.wpApiUrl}${endpoint}`, config)
    .then(async response => {
      if (response.ok) {
        return await response.json()
      } else {
        const errorMessage = await response.text()
        return Promise.reject(new Error(errorMessage))
      }
    });
}

function jseClient(endpoint, { body, token, key, ...customConfig } = {}) {

  const delayed = (value) => new Promise(resolve => setTimeout(() => { resolve(value); }, 1000))

  const multiPart = body instanceof FormData;
  const headers = multiPart ? {} : { 'Content-Type': 'application/json' }
  if(token) headers['Authorization'] = 'Bearer ' + token;
  if(key)   headers['JSE-API-KEY']   = key;

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    }
  }

  if (body) {
    config.body = multiPart ? body : JSON.stringify(body);
  }

  return window
    .fetch(`${__JSECNCT.api.apiUrl}${endpoint}`, config)
    .then(async response => {
      if (response.ok) {
        return await response.json()
      } else {
        const errorMessage = await response.text()
        return Promise.reject(new Error(errorMessage))
      }
    });
}

export const API = {
  wpClient,
  jseClient
}