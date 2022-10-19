
export class QueryCustomer {
    search?: string;
    labels?: string[];
    fromDate?: Date;
    toDate?: Date;

    demands?: string | string[]; //filter by demand id

    country?: string; 
    addressCity?: string;
    addressDistrict?: string;

}