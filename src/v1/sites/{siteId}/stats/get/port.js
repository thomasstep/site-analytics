const { logic } = require('./logic');

exports.port = async function (auth, payload) {
  const xxxxx = await logic(auth);
  return xxxxx;
}