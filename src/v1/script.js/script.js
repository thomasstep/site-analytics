const srcUrlString = document.currentScript.getAttribute('src');
const srcUrl = new URL(srcUrlString);
const srcOrigin = srcUrl.origin;
const siteId = document.currentScript.getAttribute('siteId');
const pathName = window.location.pathname;
const stats = {
  pageView: pathName,
};
fetch(`${srcOrigin}/prod/v1/sites/${siteId}/stats`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(stats),
});
