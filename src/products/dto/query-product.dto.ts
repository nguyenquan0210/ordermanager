export class QueryProduct {
    search?: string;
    category?: string;
    fromPrice?: number;
    toPrice?: number;
    malo?: number;
    code?: number;
    isOwner?: boolean;
    isHot?: boolean;
    labels?: string[] | string;
    states?: string[] | string;
}
