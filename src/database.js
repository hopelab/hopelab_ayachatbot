const redis = require('redis');
const config = require('config');
const redisClient = redis.createClient({
  host: config.redis.host,
  port: config.redis.port
});

redisClient.on("error", function (err) {
  console.log("Error " + err); //eslint-disable-line no-console
});

const cacheUtils = require('alien-node-redis-utils')(redisClient);

const {promisify} = require('util');
const getAsync = promisify(redisClient.get).bind(redisClient);
const getLAsync = promisify(redisClient.lrange).bind(redisClient);

const {
  DB_USERS,
  DB_USER_LIST,
  DB_CONVERSATIONS,
  DB_COLLECTION_LIST,
  DB_SERIES,
  DB_MESSAGE_LIST,
  DB_BLOCKS,
  DB_MEDIA,
  DB_STUDY,
  ONE_DAY_IN_MILLISECONDS,
  CRISIS_SEARCH_TERM_LIST,
  CRISIS_SEARCH_WORD_LIST,
  STOP_SEARCH_TERM_LIST,
  STOP_SEARCH_WORD_LIST,
  DB_ARCHIVE_USER_LIST,
} = require('./constants');

const { createNewUser } = require('./users');
const { keyFormatMessageId } = require('./utils/msg_utils');
const { keyFormatCollectionId } = require('./utils/collection_utils');

const getJSONItemFromCache = key =>
  getAsync(key)
    .then(item => JSON.parse(item))
    .catch(e => (
      console.error(
        `error: getItemFromCache on key: ${key}`,
        e
      )
    ));

const keyFormatUserId = id => `user:${id}`;

/**
 * Set User in Cache
 *
 * @param {Object} user
*/
const setUserInCache = user =>
  new Promise(resolve => {
    redisClient.set(keyFormatUserId(user.id), JSON.stringify(user));
    resolve(user);
  });


// NOTE: this is used in testing. DO NOT DELETE
const removeUserFromCache = user => { // eslint-disable-line no-unused-vars
  cacheUtils.deleteItem(
    keyFormatUserId(user.id)
  ).catch(e => (
    console.error(
      `error: removeUserFromCache - cacheUtils.deleteIrem(user:${user.id})`,
      e
    )
  ));
};


/**
 * Update User By ID
 *
 * @param {Object} user
 * @return {Promise}
*/
const updateUser = user => setUserInCache(user);

const updateAllUsers = (usersToUpdate = []) =>
  Promise.all(usersToUpdate.map(user => setUserInCache(user)));

/**
 * Create a User in Database
 *
 * @param {Object} { id, user }
*/
function returnNewOrOldUser({ id, user }) {
  if (!user && id) {
    const newUser = createNewUser(id);
    // remove the id if it exists for some reason already
    redisClient.lrem(DB_USER_LIST, 1, id);
    // add the id to the user list array
    redisClient.lpush(DB_USER_LIST, id);
    return Promise.resolve(setUserInCache(newUser));
  } else {
    return Promise.resolve(user);
  }
}

/**
 * Get User By ID
 *
 * @param {String} id
 * @return {Promise<Object>}
*/
const getUserById = id =>
  new Promise(resolve => {
    getJSONItemFromCache(keyFormatUserId(id))
      .then(user => resolve(returnNewOrOldUser({ id, user})))
      .catch(e => {
        // no item found matching cacheKey
        console.error(
          `error: getUserById - getJSONItemFromCache(user:${id}})`,
          e
        );
      });
  });


const findInUserList = id =>
  new Promise(resolve => {
    getLAsync(DB_USER_LIST, 0, -1)
      .then(userIds =>
        resolve(userIds.indexOf(id) > -1)
      )
      .catch(e => {
        // no item found matching cacheKey
        console.error(
          `error: findUsersInList - cacheUtils.getItem(${DB_USER_LIST})`,
          e
        );
        resolve(false);
      });
  });

const archiveUser = user => {
  redisClient.lrem(DB_USER_LIST, 0, user.id);
  redisClient.lpush(DB_ARCHIVE_USER_LIST, user.id);
  return;
};

const unArchiveUser = id => {
  redisClient.lpush(DB_USER_LIST, id);
  redisClient.lrem(DB_ARCHIVE_USER_LIST, 0, id);
  return;
};

const getUsers = () =>
  new Promise(resolve => {
    getLAsync(DB_USER_LIST, 0, -1)
      .then(userIds =>
        resolve(Promise.all(
          userIds.map(id => getUserById(id)))
        )
      )
      .catch(e => {
        // no item found matching cacheKey
        console.error(
          `error: getUsers - cacheUtils.getItem(${DB_USERS})`,
          e
        );
        resolve({});
      });
  });


/**
 * Get Conversations
 *
 * @return {Promise<Array>}
*/
const getConversations = () =>
  new Promise(resolve => {
    cacheUtils
      .getItem(DB_CONVERSATIONS)
      .then(JSON.parse)
      .then(resolve)
      .catch(e => {
        console.error(
          `error: getConversations - cacheUtils.getItem(${DB_CONVERSATIONS})`,
          e
        );
      });
  });

/**
 * Get Collections
 *
 * @return {Promise<Array>}
*/
const getCollections = () =>
  new Promise(resolve => {
    getLAsync(DB_COLLECTION_LIST, 0, -1)
      .then(collIds =>
        resolve(Promise.all(
          collIds.map(id => getCollectionById(id)))
        )
      )
      .catch(e => console.error(e));
  });

const getCollectionById = id => (
  new Promise(resolve => {
    getJSONItemFromCache(keyFormatCollectionId(id))
      .then(coll => coll ? resolve(coll) : resolve({ id: null}))
      .catch(e => {
        // no item found matching cacheKey
        console.error(
          `error: getCollectionById - getJSONItemFromCache(collection:${id}})`,
          e
        );
      });
  })
);

/**
 * Get Series
 *
 * @return {Promise<Array>}
*/
const getSeries = () =>
  new Promise(resolve => {
    cacheUtils
      .getItem(DB_SERIES)
      .then(JSON.parse)
      .then(resolve)
      .catch(e => {
        console.error(
          `error: getSeries - cacheUtils.getItem(${DB_SERIES})`,
          e
        );
      });
  });

/**
 * Get Messages
 *
 * @return {Promise<Array>}
*/

const getMessageById = id => (
  new Promise(resolve => {
    getJSONItemFromCache(keyFormatMessageId(id))
      .then(msg => msg ? resolve(msg) : resolve({ id: null }))
      .catch(e => {
        // no item found matching cacheKey
        console.error(
          `error: getMessageById - getJSONItemFromCache(message:${id}})`,
          e
        );
      });
  })
);

const getMessages = () =>  new Promise(resolve => {
  getLAsync(DB_MESSAGE_LIST, 0, -1)
    .then(messageIds =>
      resolve(Promise.all(
        messageIds.map(id => getMessageById(id)))
      )
    )
    .catch(e => console.error(e));
});

/**
 * Get Blocks
 *
 * @return {Promise<Array>}
*/
const getBlocks = () =>
  new Promise(resolve => {
    cacheUtils
      .getItem(DB_BLOCKS)
      .then(JSON.parse)
      .then(resolve)
      .catch(e => {
        console.error(
          `error: getBlocks - cacheUtils.getItem(${DB_BLOCKS})`,
          e
        );
      });
  });

/**
 * Get Media
 *
 * @return {Promise<Object>}
*/
const getMedia = () =>
  new Promise(resolve => {
    cacheUtils
      .getItem(DB_MEDIA)
      .then(JSON.parse)
      .then(resolve)
      .catch(e => {
        console.error(
          `error: getMedia - cacheUtils.getItem(${DB_MEDIA})`,
          e
        );
      });
  });

const getStudyInfo = () =>
  new Promise(resolve => {
    cacheUtils
      .getItem(DB_STUDY)
      .then(JSON.parse)
      .then(d => {
        return d;
      })
      .then(resolve)
      .catch(e => {
        if (e === undefined) {
          cacheUtils
            .setItem(DB_STUDY, ONE_DAY_IN_MILLISECONDS, [])
            .then(() => resolve([]))
            .catch(e => {
              console.error(
                `error: getStudyInfo - cacheUtils.getItem(${DB_STUDY})`,
                e
              );
            });
        } else {
          console.error(
            `error: getStudyInfo - cacheUtils.getItem(${DB_STUDY})`,
            e
          );
        }
      });
  });

const setStudyInfo = studyInfo =>
  cacheUtils.setItem(
    DB_STUDY,
    ONE_DAY_IN_MILLISECONDS,
    studyInfo
  ).catch(e => (
    console.error(
      `error: setStudyInfo - cacheUtils.setItem(${DB_STUDY})`,
      e
    )
  ));

const getParams = () =>
  new Promise(resolve => {
    Promise.all([
      getLAsync(CRISIS_SEARCH_TERM_LIST, 0, -1),
      getLAsync(CRISIS_SEARCH_WORD_LIST, 0, -1),
      getLAsync(STOP_SEARCH_TERM_LIST, 0, -1),
      getLAsync(STOP_SEARCH_WORD_LIST, 0, -1),
    ])
      .then(([crisisTerms, crisisWords, stopTerms, stopWords]) => {
        resolve({
          crisisTerms,
          crisisWords,
          stopTerms,
          stopWords
        });
      })
      .catch(e => console.error(e));
  });




module.exports = {
  getUserById,
  getMessageById,
  getUsers,
  getConversations,
  getCollections,
  getSeries,
  getMessages,
  getBlocks,
  getMedia,
  getStudyInfo,
  setStudyInfo,
  updateUser,
  updateAllUsers,
  keyFormatUserId,
  setUserInCache,
  getJSONItemFromCache,
  getCollectionById,
  getParams,
  archiveUser,
  unArchiveUser,
  findInUserList
};
