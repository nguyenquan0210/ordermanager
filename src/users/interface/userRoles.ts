export enum UserRole {
    Staff = 'staff', // nhan vien cua shop
    Admin = 'admin',
    Owner = 'owner', // user who use service
    Manager = 'manager', //
    Customer = 'customer', //
}

export enum StaffRole {
    Account = 'Account',
    Product = 'Product',
    Notification = 'Notification',
    Profile = 'Profile',
    Accountant = 'Accountant',
    AssignTodo = 'AssignTodo',
    Manager = 'Manager',
}

export const AllStaffRole = [
    'Account',
    'Product',
    'Notification',
    'Profile',
    'Accountant',
    'AssignTodo'
]

export enum LevelAccount {
    FREE = 'FREE',
    START_UP = 'START_UP',
    BASIC = 'BASIC',
    ADVANCE = 'ADVANCE'
}

export enum TypeCommission {
    Incremental = 'Incremental',
    Reset = 'Reset',
}