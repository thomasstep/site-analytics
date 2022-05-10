const { logic } = require('./logic');

async function port(auth, payload) {
  const xxxxx = await logic(auth);
  return xxxxx;
}

module.exports = {
  port,
};
