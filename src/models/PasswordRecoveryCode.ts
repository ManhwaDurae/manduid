import {Table, Column, Model, IsUUID, PrimaryKey, NotNull, NotEmpty, DataType, AllowNull, HasOne, ForeignKey, BelongsTo} from 'sequelize-typescript';
import { Member } from './Member';
import { User } from './User';

@Table
export class PasswordRecoveryCode extends Model<PasswordRecoveryCode> {
    @AllowNull(false)
    @NotNull
    @NotEmpty
    @PrimaryKey
    @Column(DataType.STRING(180))
    code: string;

    @AllowNull(false)
    @NotNull
    @NotEmpty
    @ForeignKey(() => User)
    @Column(DataType.STRING(180))
    id: string;

    @AllowNull(false)
    @NotNull
    @NotEmpty
    @Column(DataType.DATE)
    expiresAt: Date;

    @BelongsTo(() => User, 'id')
    user: User;
}