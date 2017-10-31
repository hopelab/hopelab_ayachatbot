const redis = require('redis');
const redisClient = redis.createClient();
const cacheUtils = require('alien-node-redis-utils')(redisClient);

const {
    DB_USERS,
    DB_CONVERSATIONS,
    DB_COLLECTIONS,
    DB_SERIES,
    DB_MESSAGES,
    DB_BLOCKS,
    DB_MEDIA,
    DB_USER_HISTORY,
    ONE_DAY_IN_MILLISECONDS
} = require('./constants');

const { createNewUser } = require('./users');

/**
 * Set User in Cache
 * 
 * @param {Object} user
 * @return {Promise}
*/
const setUserInCache = user => users =>
    cacheUtils.setItem(
        DB_USERS,
        ONE_DAY_IN_MILLISECONDS,
        users.map(u => (u.id === user.id ? user : u))
    );

/**
 * Update User By ID
 * 
 * @param {Object} user
 * @return {Promise}
*/
const updateUser = user =>
    new Promise(resolve => {
        cacheUtils
            .getItem(DB_USERS)
            .then(JSON.parse)
            .then(setUserInCache(user))
            .then(resolve)
            .catch(e => {
                console.error(
                    `error: updateUser - cacheUtils.getItem(${DB_USERS})`,
                    e
                );
                reject();
            });
    });

/**
 * Find User By Id
 * 
 * @param {String} id
 * @return {Object}
*/
const findUserById = id => users => ({
    id,
    user: users.find(u => u.id === id),
    users
});

/**
 * Create a User in Database
 * 
 * @param {Object} { id, user, users }
 * @return {Promise<Object>}
*/
function createUserIfNotExisting({ id, user, users }) {
    if (!user) {
        user = createNewUser(id);
        const newUsers = users.concat(user);

        return cacheUtils
            .setItem(DB_USERS, ONE_DAY_IN_MILLISECONDS, newUsers)
            .then(() => user)
            .catch(e =>
                console.error(
                    `error: getUserById - cacheUtils.setItem(${DB_USERS})`,
                    e
                )
            );
    }

    return Promise.resolve(user);
}

/**
 * Get User By ID
 * 
 * @param {String} id
 * @return {Promise<Object>}
*/
const getUserById = id =>
    new Promise(resolve => {
        cacheUtils
            .getItem(DB_USERS)
            .then(JSON.parse)
            .then(findUserById(id))
            .then(createUserIfNotExisting)
            .then(resolve)
            .catch(e => {
                // no item found matching cacheKey
                console.error(
                    `error: getUserById - cacheUtils.getItem(${DB_USERS})`,
                    e
                );
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
        cacheUtils
            .getItem(DB_COLLECTIONS)
            .then(JSON.parse)
            .then(resolve)
            .catch(e => {
                console.error(
                    `error: getCollections - cacheUtils.getItem(${DB_COLLECTIONS})`,
                    e
                );
            });
    });

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
const getMessages = () =>
    new Promise(resolve => {
        cacheUtils
            .getItem(DB_MESSAGES)
            .then(JSON.parse)
            .then(resolve)
            .catch(e => {
                console.error('error: getMessages', e);
            });
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

/**
 * Get user History
 * 
 * @return {Promise<Array>}
*/
const getUserHistory = () =>
    new Promise(resolve => {
        cacheUtils
            .getItem(DB_USER_HISTORY)
            .then(JSON.parse)
            .then(resolve)
            .catch(e => {
                console.error(
                    `error: getUserHistory - cacheUtils.getItem(${DB_USER_HISTORY})`,
                    e
                );
            });
    });

module.exports = {
    getUserById,
    getConversations,
    getCollections,
    getSeries,
    getMessages,
    getBlocks,
    getMedia,
    getUserHistory,
    updateUser
};