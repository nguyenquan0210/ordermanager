export function getArrayField(object: Object[], field: string ){
    var strs = [];
    if (object) {        
        object.forEach(obj => {
            for (let key in obj) {
                if (key == field) {
                    strs.push(obj[key].toString());
                }
            }
        });
    }

    return strs;
}

export function getIds(object: Object[]) {
    var strs = [];
    if (object) {
        object.forEach(obj => {
            for (let key in obj) {
                if (key == "_id") {
                    strs.push(`${obj[key]}`);
                }
            }
        });
        return object.map(obj => obj['_id'])
    }

    return strs;
}
