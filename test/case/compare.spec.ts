import { difference } from "../../src/commons/utils/difference"
import { Types } from 'mongoose';

describe('Test compate 2 Date', () => {
    const d1 = new Date("2021-11-16T00:00:00Z");
    const d2 = new Date("2021-11-16T00:01:00Z");

    it('should pass 1', () => {
        const diff = difference({ date: 132 }, { date: 456 });
        console.log(diff);
        expect(diff).toMatchObject({ date: 132 });
    })
    it('should pass 2', () => {
        const diff = difference({ date: d1 }, { date: d2 });
        console.log(diff);
        expect(diff).toMatchObject({ date: d1 });
        d1 instanceof Date
    })
})

describe('Test compare object has objectId', () => {
    const id1 = new Types.ObjectId('62145edebc136700105e823d');
    const id2 = new Types.ObjectId('62145edebc136700105e823d');

    it('should not be different', () => {
        const diff = difference({ _id: id1 }, { _id: id2 })

        expect(diff).toStrictEqual({}) //no differrent
    })

    it('should be diff', () => {
        const id3 = new Types.ObjectId('6193c78d15aa7f001137f0dd')

        const diff = difference({ _id: id3, name: 'a' }, { _id: id1, name: 'b' })
        console.log(JSON.stringify(diff));
        expect(diff).toStrictEqual({ _id: '6193c78d15aa7f001137f0dd', name: 'a' })
    })

    it('should be diff array', () => {
        const id3 = new Types.ObjectId('6193c78d15aa7f001137f0dd')
        const diff = difference({
            _id: id3, arr: [
                { _id: id3, val: 'abc' }
            ]
        }, {
            _id: id3, arr: [
                { _id: id2, val: 'xyz' },
                { _id: id3, val: 'abc' }
            ]
        })

        console.log(JSON.stringify(diff));

        expect(diff).toEqual({
            arr: [
                { _id: id3.toHexString(), val: 'abc' }
            ]
        })
    })
})