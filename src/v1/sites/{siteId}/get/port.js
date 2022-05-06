const { logic } = require('./logic');

exports.port = async function (auth, siteId) {
  const siteData = await logic(auth, siteId);
  return siteData;
}