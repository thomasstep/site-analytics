const { logic } = require('./logic');

exports.port = async function (auth) {
  const sites = await logic(auth);
  return sites;
}