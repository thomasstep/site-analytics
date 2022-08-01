const AUTHENTICATION_SERVICE_URL = 'https://kelxh6t44h.execute-api.us-east-1.amazonaws.com/prod';
const APPLICATION_ID = 'ebcf1967-94d6-4fe1-9f28-323614e4e1a1';
const DEBUG = 'true' === 'true';

function handleSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const jsonData = Object.fromEntries(data.entries());
  fetch(`${AUTHENTICATION_SERVICE_URL}/v1/applications/${APPLICATION_ID}/users/token?` + new URLSearchParams(jsonData))
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

      window.location.replace('/');
    })
    .catch((err) => {
      if (DEBUG) {
        console.error(err);
      }
    });
}
const form = document.querySelector('form');
form.addEventListener('submit', handleSubmit);

