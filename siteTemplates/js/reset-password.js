const AUTHENTICATION_SERVICE_URL = '{{{ AUTHENTICATION_SERVICE_URL }}}';
const APPLICATION_ID = '{{ APPLICATION_ID }}';
const DEBUG = '{{ DEBUG }}' === 'true';

function handleSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const jsonData = Object.fromEntries(data.entries());
  fetch(`${AUTHENTICATION_SERVICE_URL}/v1/applications/${APPLICATION_ID}/users/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }

      if (DEBUG) {
        console.log('Successful call');
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
