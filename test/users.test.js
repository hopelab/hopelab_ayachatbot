const expect = require('expect');
const testModule = require('../src/users');

describe('Users Module', () => {
    describe('updateBlockScope', () => {
        it('removes last element if it is marked isEnd', () => {
            const blocks = [{}, {}, {}];
            let blockScope;

            blockScope = testModule.updateBlockScope({ isEnd: true }, blocks);
            expect(blockScope.length).toEqual(2);

            blockScope = testModule.updateBlockScope({ isEnd: false }, blocks);
            expect(blockScope.length).toEqual(3);
        });

        it('pushes a new block scope in if current message points to a next block', () => {
            const blocks = [{}, {}, {}];
            let blockScope;

            blockScope = testModule.updateBlockScope(
                { next: { id: 'block-2' } },
                blocks
            );
            expect(blockScope.length).toEqual(4);

            blockScope = testModule.updateBlockScope({}, blocks);
            expect(blockScope.length).toEqual(3);
        });
    });

    describe('updateHistory', () => {
        it('pushes a new message into history', () => {
            const history = [{}, {}, {}];

            const newHistory = testModule.updateHistory({}, history);

            expect(newHistory.length).toEqual(4);
        });
    });

    describe('isNextMessageBlock', () => {
        it('says if next message is a block element', () => {
            expect(
                testModule.isNextMessageBlock({ next: { id: 'block-1' } })
            ).toBe(true);

            expect(
                testModule.isNextMessageBlock({ next: { id: 'message-1' } })
            ).toBe(false);
        });
    });
});
