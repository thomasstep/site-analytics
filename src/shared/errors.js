class ApiKeyError extends Error {
  constructor(message) {
    super(message);

    this.name = 'ApiKeyError';
  }
}

class InputError extends Error {
  constructor(message) {
    super(message);

    this.name = 'InputError';
  }
}

class MissingUniqueIdError extends Error {
  constructor(message) {
    super(message);

    this.name = 'MissingUniqueIdError';
  }
}

module.exports = {
  ApiKeyError,
  InputError,
  MissingUniqueIdError,
};
