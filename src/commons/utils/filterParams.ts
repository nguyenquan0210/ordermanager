import _ from "lodash";

export function filterParams(originQuery, picks: string[]) {
    const cond = _.pickBy(_.pick(originQuery, picks), _.identity);
    return cond;
}
