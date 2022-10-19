
export class OkRespone {
    private message: string;
    private data: any;
    constructor({ message, data }: { message?: string, data?: any } = {}) {
        this.message = message || 'Success';
        this.data = data;
    }
}