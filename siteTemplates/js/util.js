const constants = {
  tokenCookieName: 'authToken',
};

// ****************************************************************************
// DOM manipulation
// ****************************************************************************

function addTextToElement(id, text) {
  const textNode = document.createTextNode(text);
  const element = document.getElementById(id);
  element.appendChild(textNode);
}

// ****************************************************************************
// Cookie things
// ****************************************************************************

function getCookie(name) {
  return document.cookie
  .split('; ')
  .find((row) => row.startsWith(`${name}=`))
  ?.split('=')[1];
}

function setCookie(name, value) {
  const newCookie = `${name}=${value}; max-age=${60*60*24}; secure; samesite=strict`;
  document.cookie = newCookie;
}

export {
  constants,
  addTextToElement,
  getCookie,
  setCookie,
}
