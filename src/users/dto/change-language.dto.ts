import { IsObject, IsString, IsArray, IsBoolean } from "class-validator";

export class ChangeLanguageDto {
    @IsString()
    defaultLanguage: string;
}