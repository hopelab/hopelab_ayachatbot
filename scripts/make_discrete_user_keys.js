// NOTE: this script breaks the large JSON string of users into discrete msg keys for better
// performance, storage, and debug ability. It also creates a list key of user ids.

const constants = require('../src/constants');
const { keyFormatUserId } = require('../src/database');

const { DB_USER_LIST, EXPIRE_USER_AFTER, SECONDS_EXPIRE_ARG } = constants;

const {promisify} = require('util');

let redis = require('redis');
const config = require('config');

const redisClient = redis.createClient({
  host: config.redis.host,
  port: config.redis.port
});


const getAsync = promisify(redisClient.get).bind(redisClient);

getAsync("users").then(res => {
  const json_users = JSON.parse(res);
  const length = json_users.length;
  json_users.forEach(user => {
    const { id } = user;
    redisClient.lpush(DB_USER_LIST, id);
    redisClient.set(keyFormatUserId(id), JSON.stringify(user), SECONDS_EXPIRE_ARG, EXPIRE_USER_AFTER);
  });
  console.log('rewrote ' + length + ' users');// eslint-disable-line no-console

  redisClient.quit();
  setTimeout(() => {
    process.exit(0)
  }, 3000)
}).catch(err => {console.log(err); process.exit(1);}); // eslint-disable-line no-console
