const { logic } = require('./logic');

exports.port = async function (auth, siteId) {
  await logic(auth, siteId);
  return;
}