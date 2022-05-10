function constructAuth(event) {
  const {
    userUniqueId,
  } = event.requestContext.authorizer;

  return {
    userUniqueId,
  };
}

module.exports = {
  constructAuth,
};
