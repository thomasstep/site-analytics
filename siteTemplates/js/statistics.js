import {
  constants,
  addTextToElement,
  getCookie,
} from "./util.js";

const ANALYTICS_SERVICE_URL = '{{{ ANALYTICS_SERVICE_URL }}}';
const DEBUG = '{{ DEBUG }}' === 'true';

function onPageLoad() {
  const token = getCookie(constants.tokenCookieName);
  if (!token) {
    window.location.replace('/signin.html');
  }

  const params = new URLSearchParams(document.location.search);
  const siteId = params.get("siteId");
  if (!siteId) {
    addTextToElement('stats-text', 'Invalid Site ID');
    return;
  }

  fetch(`${ANALYTICS_SERVICE_URL}/v1/sites/${siteId}/stats`, {
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

        addTextToElement('stats-text', JSON.stringify(jsonData));
    })
    .catch((err) => {
      if (DEBUG) {
        console.error(err);
      }
    });
}

// Run this as the script is called
window.addEventListener('load', onPageLoad);
