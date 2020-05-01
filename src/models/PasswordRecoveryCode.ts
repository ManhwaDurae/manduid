import {
    AllowNull,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    NotEmpty,
    NotNull,
    PrimaryKey,
    Table
} from 'sequelize-typescript';
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
