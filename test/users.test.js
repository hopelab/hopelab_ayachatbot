const expect = require('chai').expect;
const moment = require('moment');

const testModule = require('../src/users');
const { TYPE_BLOCK, TYPE_MESSAGE, TYPE_ANSWER } = require('../src/constants');
const utilityModule = require('../src/utils/user_utils');

describe('Users Module', () => {
  describe('createNewUser', () => {
    it('returns a default user object for given id', () => {
      const newUser = testModule.createNewUser('12345');

      expect(newUser.id).to.equal('12345');
    });
  });

  describe('updateBlockScope', () => {
    xit('removes last element if it is marked isEnd', () => {
      const blocks = [{}, {}, {}];
      let blockScope;

      blockScope = testModule.updateBlockScope({ isEnd: true }, blocks);
      expect(blockScope.length).to.equal(2);

      blockScope = testModule.updateBlockScope({ isEnd: false }, blocks);
      expect(blockScope.length).to.equal(3);
    });

    xit('pushes a new block scope in if current message points to a next block', () => {
      const blocks = [{}, {}, {}];
      let blockScope;

      blockScope = testModule.updateBlockScope(
        { next: { id: 'block-2', type: TYPE_BLOCK } },
        blocks
      );
      expect(blockScope.length).to.equal(4);

      blockScope = testModule.updateBlockScope({}, blocks);
      expect(blockScope.length).to.equal(3);
    });
  });

  describe('updateHistory', () => {
    it('pushes a new message into history', () => {
      const history = [{}, {}, {}];

      const newHistory = utilityModule.updateHistory({}, history);

      expect(newHistory.length).to.equal(4);
    });
  });

  describe('getPreviousMessageInHistory', () => {
    const messages = [{ id: 1 }];
    const user = { history: [{ id: 1 }] };

    it('returns the previous message in the user history', () => {
      let message = testModule.getPreviousMessageInHistory(
        messages,
        user
      );
      expect(message).to.deep.equal(messages[0]);

      message = testModule.getPreviousMessageInHistory(messages, {
        history: []
      });
      expect(message).to.deep.equal({});
    });
  });

  describe('isNextMessageBlock', () => {
    it('says if next message is a block element', () => {
      expect(
        testModule.isNextMessageBlock({
          next: { id: 'block-1', type: TYPE_BLOCK }
        })
      ).to.be.true;

      expect(
        testModule.isNextMessageBlock({
          next: { id: 'message-1', type: TYPE_MESSAGE }
        })
      ).to.be.false;

      expect(testModule.isNextMessageBlock({ next: {} })).to.be.false;
    });
  });
});

describe('User Utility Module', () => {
  describe('shouldArchiveUser', () => {
    it('should not archive a user that has gone 30 days without an answer', () => {
      const newUser = testModule.createNewUser('12345');
      const now = moment();
      const then = now - 30 * 24 * 60 * 60 * 1000;
      expect(newUser.id).to.equal('12345');
      const history = [{type: TYPE_ANSWER, timestamp: then}];
      newUser.history = history;
      expect(utilityModule.shouldArchiveUser(newUser, now)).to.be.false;
    });

    it('should archive a user that has gone 31 days without an answer', () => {
      const newUser = testModule.createNewUser('12345');
      const now = moment();
      const then = now - 31 * 24 * 60 * 60 * 1000;
      expect(newUser.id).to.equal('12345');
      const history = [{type: TYPE_ANSWER, timestamp: then}];
      newUser.history = history;
      expect(utilityModule.shouldArchiveUser(newUser, now)).to.be.true;
    });
  });
});
