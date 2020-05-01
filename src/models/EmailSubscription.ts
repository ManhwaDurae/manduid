import {
    AllowNull,
    AutoIncrement,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    NotNull,
    PrimaryKey,
    Table
} from 'sequelize-typescript';
import { User } from './User';

@Table
export class EmailSubscription extends Model<EmailSubscription> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @NotNull
    @Column(DataType.ENUM('NewApplication'))
    subscriptionType: EmailSubscriptionType;

    @ForeignKey(() => User)
    @Column(DataType.STRING(180))
    userId: string;

    @BelongsTo(() => User, 'userId')
    user: User;
}
