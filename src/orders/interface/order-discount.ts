export enum StyleDiscount {
    percent = "percent",
    money = "money",
}

export enum OrderStatusEnum {
    Cancel = "Cancel",
    Processing = "Processing",
    Delivering = "Delivering",
    Paid = "Paid",
    Received = "Received"
}

export const ORDER_STATUS_ENUM = {
    Cancel: {
        name : "Cancel",
        name_vn : "Đã hủy",
        description: "",
        color: "FF00D279",
    },
    Processing: {
        name : "Processing",
        name_vn : "Đã đang xử lý",
        description: "",
        color: "FF6A0000",
    },
    Delivering: {
        name : "Delivering",
        name_vn : "Đang giao",
        description: "",
        color: "FF00A9BB",
    },
    Paid: {
        name : "Paid",
        name_vn : "Đã thanh toán",
        description: "",
        color: "FF008A57",
    },
    Received: {
        name : "Received",
        name_vn : "Đã nhận",
        description: "",
        color: "FF00D279",
    }
}

export const ORDER_STATUS_ARR = [
    {
        name : "Cancel",
        name_vn : "Đã hủy",
        description: "",
        color: "FF00D279",
    },
    {
        name : "Processing",
        name_vn : "Đã đang xử lý",
        description: "",
        color: "FF6A0000",
    },
    {
        name : "Delivering",
        name_vn : "Đang giao",
        description: "",
        color: "FF00A9BB",
    },
    {
        name : "Paid",
        name_vn : "Đã thanh toán",
        description: "",
        color: "FF008A57",
    },
    {
        name : "Received",
        name_vn : "Đã nhận",
        description: "",
        color: "FF00D279",
    }
]

