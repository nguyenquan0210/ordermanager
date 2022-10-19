import _ from "lodash";

function changes(object, base): object {
    return _.transform(object, function (result, value, key) {
        if (!_.isEqual(value, base[key])) {
            if (_.isObject(value) && _.isObject(base[key])) {
                if (value instanceof Date) {
                    result[key] = value;
                } else if (key == '_id') {
                    result[key] = value.toString();
                } else {
                    result[key] = changes(value, base[key]);
                }
            } else {
                result[key] = value;
            }

        }
    });
}

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
export function difference(object, base) {
    try {
        return changes(object, base);
    } catch (error) {        
        return null;
    }
}
