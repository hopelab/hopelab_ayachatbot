const R = require('ramda');
const moment = require('moment');

const {
  TYPE_ANSWER,
  END_OF_CONVERSATION_ID,
  TYPE_QUESTION_WITH_REPLIES,
  QUICK_REPLY_RETRY_ID_CONTINUE,
  CUT_OFF_HOUR_FOR_NEW_MESSAGES,
  TYPE_BACK_TO_CONVERSATION,
  TYPE_QUESTION,
  MESSAGE_TYPE_TEXT,
} = require('../constants');

const {
  getLastSentMessageInHistory,
  findByType
} = require('./msg_utils');

const isTypeBackToConversation = m => m && m.next && R.equals(m.next.type, TYPE_BACK_TO_CONVERSATION) && !m.parent;

const payloadIsBackToConvo = message => {
  if (message && message.quick_reply && message.quick_reply.payload) {
    const payload = JSON.parse(message.quick_reply ? message.quick_reply.payload : "{}");
    if (R.equals(payload.id, QUICK_REPLY_RETRY_ID_CONTINUE) || R.equals(payload.type, TYPE_BACK_TO_CONVERSATION))
      return true;
  }
  return false;
};

const findLastNonConversationEndMessage = user => {
  if (!user.history) { return undefined; }

  for(let i = user.history.length - 1; i >= 0; i--) {
    if (
      user.history[i].id !== END_OF_CONVERSATION_ID &&
      user.history[i].type !== TYPE_ANSWER
    ) {
      return user.history[i];
    }
  }
  return undefined;
};

const atEndOfConversationAndShouldRestart = (user, timeNow, cutOffHour, cutOffMinute=0) => {
  const lastMessage = getLastSentMessageInHistory(user);

  if (R.path(['next', 'id'], lastMessage) !== END_OF_CONVERSATION_ID) {
    return false;
  }
  const lastRealMessage = findLastNonConversationEndMessage(user);
  if (lastRealMessage) {
    let cutOffTime = moment().startOf('day').hour(cutOffHour).minute(cutOffMinute).unix();
    if (timeNow < cutOffTime) {
      cutOffTime = moment().subtract(1, 'day').startOf('day').hour(cutOffHour).minute(cutOffMinute).unix();
    }

    return (
      (timeNow > cutOffTime) &&
          (cutOffTime * 1000 > lastRealMessage.timestamp)
    );
  }

  return false;

};

const isEndOfConversation = message => R.path(['next', 'id'], message) === END_OF_CONVERSATION_ID &&
  R.path(['messageType'], message) !== TYPE_QUESTION_WITH_REPLIES;

const shouldStartNewConversation = (message, user) =>
  R.path(['next', 'id'], message) === END_OF_CONVERSATION_ID &&
    R.path(['messageType'], message) !== TYPE_QUESTION_WITH_REPLIES &&
    atEndOfConversationAndShouldRestart(user, moment().unix(), CUT_OFF_HOUR_FOR_NEW_MESSAGES);

const doesMessageStillExist = (message, messages) =>
  !!(messages.find(m => message.id === m.id));


const isMessageTrackDeleted = (lastMessage, messages) =>
  R.path(['next', 'id'], lastMessage) &&
    lastMessage.messageType !== TYPE_QUESTION_WITH_REPLIES &&
    lastMessage.messageType !== TYPE_QUESTION &&
    (!doesMessageStillExist(lastMessage, messages) ||
     !doesMessageStillExist(lastMessage.next, messages));

const hasSentResponse = message => message && !!message.quick_reply;

const hasNotSentResponse = (lastMessageSentByBot, message) => {
  if (R.path(['messageType'], lastMessageSentByBot) === TYPE_QUESTION) return false;
  return (R.path(['messageType'], lastMessageSentByBot) === TYPE_QUESTION_WITH_REPLIES && !message.quick_reply);
};

const isSameDay = convoStartTime => {
  const currentTimeMs = moment();
  const momentConvoStart = moment(convoStartTime);
  return (currentTimeMs.endOf('day').diff(momentConvoStart, 'hours') < 2);
};

const isLastItemInParent = (lastMessage, message) => {
  if ((message && message.quick_reply && message.quick_reply.payload )
  || (lastMessage && lastMessage.type !== MESSAGE_TYPE_TEXT)) {
    return (!lastMessage.next || lastMessage.next.type === TYPE_BACK_TO_CONVERSATION) &&
    !lastMessage.quick_replies.length &&
    (!lastMessage.quick_reply || !message.quick_reply.payload.next);
  }
};

const parentPath = ({lastMessage, blocks, series, collections }) => {
  let item = lastMessage;
  let parent = findByType(lastMessage.parent, { blocks, series, collections });
  while (parent) {
    item = parent;
    parent = findByType(parent.parent, { blocks, series, collections });
  }
  return item;
};



module.exports = {
  isTypeBackToConversation,
  payloadIsBackToConvo,
  isEndOfConversation,
  shouldStartNewConversation,
  isMessageTrackDeleted,
  hasSentResponse,
  hasNotSentResponse,
  isSameDay,
  isLastItemInParent,
  parentPath
};
