const AUTHENTICATION_SERVICE_URL = '{{{ AUTHENTICATION_SERVICE_URL }}}';
const APPLICATION_ID = '{{ APPLICATION_ID }}';
const DEBUG = '{{ DEBUG }}' === 'true';

function handleSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  console.log(data.entries())
  const jsonData = Object.fromEntries(data.entries());
  fetch(`${AUTHENTICATION_SERVICE_URL}/v1/applications/${APPLICATION_ID}/users/verification?` + new URLSearchParams(jsonData))
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

      window.location.replace('/signin.html');
    })
    .catch((err) => {
      if (DEBUG) {
        console.error(err);
      }
    });
}
const form = document.querySelector('form');
form.addEventListener('submit', handleSubmit);

