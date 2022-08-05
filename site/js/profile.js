import {
  constants,
  addTextToElement,
  getCookie,
} from "./util.js";

const ANALYTICS_SERVICE_URL = 'https://10tud8pp0k.execute-api.us-east-1.amazonaws.com/prod';
const DEBUG = 'true' === 'true';

function onPageLoad() {
  const token = getCookie(constants.tokenCookieName);
  if (!token) {
    window.location.replace('/signin.html');
  }

  fetch(`${ANALYTICS_SERVICE_URL}/v1/sites`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }

      return response.json();
    })
    .then((jsonData) => {
      if (DEBUG) {
        console.log(jsonData);
      }

      const siteTypes = ['owner', 'admin', 'writer', 'reader'];
      siteTypes.forEach((type) => {
        addTextToElement(`${type}-sites`, jsonData[type]);
      });
    })
    .catch((err) => {
      if (DEBUG) {
        console.error(err);
      }
    });
}

// Run this as the script is called
window.addEventListener('load', onPageLoad);
