import * as funcs from "./functions"

async function executeFunc(funcName: string, params: string[]) {
    console.table(Object.keys(funcs));
    console.log(`Request exec func: ${funcName}`);
    console.log(`with params: ${params.length > 0 ? params.join(',') : 'n/a'}`);
    console.log('-----------------------------');
    if (Object.keys(funcs).length == 0) {
        console.error('No function found');
        process.exit(0);
    } else if (Object.keys(funcs).length > 0) {
        if (funcs[funcName]) {
            let func = funcs[funcName];
            try {
                await func(...params);
                console.log('-----------------------------');
                console.log('Done!');
            } catch (error) {
                console.error(error);
            } finally {
                process.exit(0);
            }
        } else {
            console.error(`Error: function: ${funcName} is not defined`);
            process.exit(0);
        }
    }
}

const argv = process.argv.slice(2);
const params = argv.slice(1);
executeFunc(argv[0], params);
