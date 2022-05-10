const { logic } = require('./logic');

async function port(auth, payload) {
  const {
    url,
    name,
  } = payload;
  const id = await logic(auth, url, name);
  return id;
}

module.exports = {
  port,
};
