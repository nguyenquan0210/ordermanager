import multer from "multer";
import path from "path";
import fs from "fs";
import { PUBLIC_PATH, UPLOAD_PATH } from "src/commons/constants/pathConstanst";
import { getSlug } from "src/commons/utils/getSlug";
import { BadRequestException } from "@nestjs/common";

function multerStorage(nestPath: string = '', forceName?: string) {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            let dest = path.join(__dirname, '/../../../', PUBLIC_PATH, UPLOAD_PATH, nestPath);
            
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
        },
        filename: function (req, file, cb) {
            const fileNameSplit = file.originalname.split('.');
            if (forceName != undefined && forceName.length > 0) {
                return cb(null, `${forceName}.${fileNameSplit[fileNameSplit.length - 1]}`);
            }

            const now = Date.now();
            const cleanName = getSlug(fileNameSplit[0]);
            
            cb(null, `${now}-${cleanName}.${fileNameSplit[fileNameSplit.length - 1]}`);
        }
    });

    return storage;
}

function multerFileFilter(fileFilters: string[] | null) {
    return function (req, file, cb) {
        if (fileFilters) {
            var extensionToUpperCase = fileFilters.map(e => e.toLowerCase());
            if (extensionToUpperCase.indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
                return cb(new BadRequestException('UnsupportExtension'));
            }
            cb(null, true);
        } else {
            cb(null, true);
        }
    }
}

export {
    multerStorage,
    multerFileFilter
}