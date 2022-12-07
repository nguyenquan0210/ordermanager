import path from "path";
import fs from 'fs';
import { promisify } from "util";
import { PUBLIC_PATH, UPLOAD_PATH } from "../constants/pathConstanst";

export class StaticFile {
    public static baseRoute: string = '/static';
    public static getStaticUrl(filePath: string[]) {
        let url = path.join(this.baseRoute, ...filePath);
        return url;
    }

    public static getLocalFile(staticUrl: string) {
        let extract = staticUrl.split('/');
        extract.shift(); //remove first empty element
        if (extract[0] === 'static') {
            extract.shift(); //remove 'static'

            return path.join(__dirname, '../../../..', PUBLIC_PATH, ...extract);
        }
        else return '';
    }

    public static async deleteStaticFile(_path: string) {
        if (_path) {
            if (fs.existsSync(_path)) {
                const unlinkAsync = promisify(fs.unlink);
                await unlinkAsync(_path);
            }
        }
    }

    public static async moveFile(_srcFile: string, _destFile: string) {
        if (_srcFile && _destFile) {
            if (fs.existsSync(_srcFile)) {
                const baseDir = path.dirname(_destFile);
                if (!fs.existsSync(baseDir)) {
                    fs.mkdirSync(baseDir, { recursive: true });
                }
                fs.rename(_srcFile, _destFile, (err) => {
                    if (err) throw err;
                    console.log('Rename complete!');
                });
            }
        }
    }

    public static getFileName(url: string) {
        let extract = url.split('/');
        const filename = extract[extract.length-1];
        return filename
    }

    public static getLocalFileUpload(pathFile: string, filename: string) {
        const url = path.join(__dirname, '../../../..', PUBLIC_PATH, UPLOAD_PATH, pathFile, filename);
        console.log(url);
        
        return url;
    }
}