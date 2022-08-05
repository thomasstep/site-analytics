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
  const existingCookies = document.cookie;
  const newCookie = `${name}=${value}`;
  let newCookies = existingCookies;
  // If there are no cookies we do not need a separator
  if (existingCookies.length == 0) {
    newCookies = newCookie;
  } else {
    newCookies += '; ';
    newCookies += newCookie;
  }

  document.cookie = newCookies;
}

export {
  constants,
  addTextToElement,
  getCookie,
  setCookie,
}
