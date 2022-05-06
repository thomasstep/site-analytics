const { logic } = require('./logic');

exports.port = async function (auth, payload) {
  const {
    url,
    name,
  } = payload;
  const id = await logic(auth, url, name);
  return id;
}