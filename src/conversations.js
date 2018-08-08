const {
  generateUniqueStudyId
} = require('./messages');

const {
  INTRO_CONVERSATION_ID,
  INTRO_BLOCK_ID,
  STUDY_ID_LIST,
} = require('./constants');

const R = require('ramda');

/**
 * Check if conversation is live and not the intro
 *
 * @param {Object} conversation
 * @return {Boolean}
*/
function conversationIsLiveAndNotIntro(conversation) {
  return conversation.isLive && conversation.id !== INTRO_CONVERSATION_ID;
}
/**
 * Get a random conversation track
 *
 * @param {Array} conversations
 * @return {String}
*/
function getRandomConversationTrack(conversations) {
  return R.prop(
    'id',
    conversations[Math.floor(Math.random() * conversations.length)]
  );
}


/**
 * Check if the assigned conversation track is gone
 *
 * @param {String} conversation
 * @param {Array} conversations
 * @return {Boolean}
*/
function assignedConversationTrackIsDeleted(conversation, conversations) {
  return conversations.indexOf(conversation) === -1;
}

/**
 * Start a new Converation Track
 *
 * @param {Array} conversations
 * @param {Array} messages
 * @param {Array} collections
 * @param {Object} user
 * @return {Object}
*/
function newConversationTrack(conversations, messages, collections, studyInfo, user) {
  let conversationTrack;

  let userUpdates = Object.assign({}, user);

  if (!user.introConversationSeen) {
    conversationTrack = INTRO_CONVERSATION_ID;
    userUpdates.introConversationSeen = true;
  } else if (
    !userUpdates.assignedConversationTrack ||
        assignedConversationTrackIsDeleted(
          userUpdates.assignedConversationTrack,
          conversations
        )
  ) {
    userUpdates.assignedConversationTrack = getRandomConversationTrack(
      conversations
    );
    conversationTrack = userUpdates.assignedConversationTrack;
  } else {
    conversationTrack = userUpdates.assignedConversationTrack;
  }

  const next = messages
    .concat(collections)
    .find(
      R.both(
        R.pathEq(['parent', 'id'], conversationTrack),
        R.propEq('start', true)
      )
    );

  if (
    user.assignedConversationTrack !== userUpdates.assignedConversationTrack
  ) {
    userUpdates.conversationStartTimestamp = Date.now();
    const newConversation = conversations.find(c => (
      c.id === userUpdates.assignedConversationTrack
    ));
    if (
      !Number.isFinite(Number(userUpdates.studyId)) &&
        newConversation &&
        newConversation.isStudy
    ) {
      userUpdates.studyId = generateUniqueStudyId(studyInfo, STUDY_ID_LIST);
      userUpdates.studyStartTime = Date.now();
    }
  }
  return {
    action: { type: next.type, id: next.id },
    block: INTRO_BLOCK_ID,
    user: userUpdates
  };
}

module.exports = {
  conversationIsLiveAndNotIntro,
  newConversationTrack,
};
