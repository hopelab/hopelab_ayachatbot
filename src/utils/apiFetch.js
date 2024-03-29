const request = require('request');

const R = require('ramda');
const { logger } = require('../logger');

const apiFetch = ({ uri, data, method, options }) => {
  return new Promise((resolve, reject) => {
    return request(
      {
        uri,
        headers: {
          "Content-Type": "application/json"
        },
        method: method || 'GET',
        body: data,
        json: true,
        ...options,
      },
      (error, response, body) => {
        if (!error && response.statusCode == 200) {
          resolve(body);
        } else {
          if (!error) {
            error = {
              statusCode: R.path(['statusCode'], response),
              id: R.path(['recipient', 'id'], data),
              fbCode: R.path(['body', 'error', 'code'], response),
              fbErrorSubcode: R.path(['body', 'error', 'error_subcode'], response),
              fbMessage: R.path(['body', 'error', 'message'], response)
            };
          }

          console.error('ERROR: Unable to fetch in callSendAPI');
          console.error(error);
          logger.log('error',
            `Unable to fetch, error: ${JSON.stringify(error)}, message: ${JSON.stringify(data)}`);
          reject(error);
        }
      }
    );
  });
};

module.exports = apiFetch;
