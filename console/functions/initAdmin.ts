import mongoose from "mongoose";
import { connectUrl, connectOptions } from "../../src/configs/mongo.cnf";
import { UsersService } from "../../src/users/users.service";
import { UserDocument, UserSchema } from "../../src/users/entities/user.entity";
import { UserRole } from "../../src/users/interface/userRoles";

export async function initAdmin() {
    const conn = await mongoose.createConnection(connectUrl, connectOptions);
    const exist = await conn.collection('users').findOne({ 'username': 'admin' });
    if (exist) {
        console.log('Admin already existed');
        await conn.close();
        return;
    }

    const userModel = conn.model<UserDocument>('users', UserSchema);
    const service = new UsersService(userModel, null);
    const admin = await service.create({
        fullName: 'super administrator',
        email: 'admin',
        password: '123456',
        phone: '0123456789',
        role: UserRole.Admin,
    }, {
        role: UserRole.Admin, userId: '0', username: ''
    });
    await admin.save();
    console.log('Admin created ' + admin._id);

    const owner = await service.create({
        fullName: 'The First Owner (LTTLand)',
        email: 'lttland_root',
        password: '123456',
        role: UserRole.Owner
    }, {
        role: UserRole.Admin,
        userId: admin._id,
        username: admin.username
    });
    await owner.save();
    console.log('Owner created ' + owner._id);

    await conn.close();
}
