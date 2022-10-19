import { getSlug } from "src/commons/utils/getSlug"

const texts = [
    {
        input: 'xin @chao',
        expect: 'xin-chao'
    },
    {
        input: 'xin chào',
        expect: 'xin-chao'
    },
    {
        input: 'Việt Nam',
        expect: 'viet-nam'
    },
    {
        input: 'Khóa học ươm mầm',
        expect: 'khoa-hoc-uom-mam'
    },
    {
        input: 'Khóa học tiểu học  ',
        expect: 'khoa-hoc-tieu-hoc'
    },
    {
        input: 'Khóa học THCS tại Trung tâm',
        expect: 'khoa-hoc-thcs-tai-trung-tam'
    },
    {
        input: 'Nguyễn Vằn Nguyện',
        expect: 'nguyen-van-nguyen'
    },
    {
        input: 'trên app sẽ hiện ra các thông tin như trên.',
        expect: 'tren-app-se-hien-ra-cac-thong-tin-nhu-tren'
    }

]
describe.each(texts)('Test slug generate', (data) => {
    it('should gen correct: ' + data.input, () => {
        const slug = getSlug(data.input);
        expect(slug).toEqual(data.expect);
    })
})

describe('Test slug truncate', () => {
    const data = {
        input: 'trên app sẽ hiện ra các thông tin như trên.',
        expect: 'tren-app-se-hien-ra-cac-thong-tin-nhu-tren'
    }
    it("should gen without truncate", () => {
        const slug = getSlug(data.input, { truncate: 0 });
        expect(slug).toEqual(data.expect);
    })

    it('should gen slug with truncate bigger than result length', () => {
        const slug = getSlug(data.input, { truncate: 100 });
        expect(slug).toEqual(data.expect);
    })
    it('should gen slug with truncate equal result length', () => {
        const slug = getSlug(data.input, { truncate: data.expect.length });
        expect(slug).toEqual(data.expect);
    })
    it('should gen slug with truncate less than result length', () => {
        const slug = getSlug(data.input, { truncate: 30 });
        expect(slug.length).toBeLessThanOrEqual(30)
        expect(slug).toEqual('tren-app-se-hien-ra-cac-thong')
    })
})