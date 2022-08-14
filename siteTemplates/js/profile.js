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

  fetch(`${ANALYTICS_SERVICE_URL}/v1/sites`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((response) => {
      // Check for 401
      if (response.status === 401) {
        if (DEBUG) {
          console.log('Recieved 401, redirecting to sign in.');
        }

        window.location.replace('/signin.html');
      }

      // Other uncovered error codes
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
        const siteIds = jsonData[type];
        const siteTypeElement = document.getElementById(`${type}-sites`);
        siteIds.forEach((siteId) => {
          const aTag = document.createElement('a');
          const textNode = document.createTextNode(siteId);
          aTag.appendChild(textNode);
          aTag.title = siteId;
          aTag.href = `statistics.html?siteId=${siteId}`;
          siteTypeElement.appendChild(aTag);
        });
      });
    })
    .catch((err) => {
      if (DEBUG) {
        console.error(err);
      }

      // TODO show some sort of generic error popup
    });
}

// Run this as the script is called
window.addEventListener('load', onPageLoad);
