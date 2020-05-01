import {
    AllowNull,
    AutoIncrement,
    Column,
    DataType,
    ForeignKey,
    HasOne,
    Model,
    NotNull,
    PrimaryKey,
    Table
} from 'sequelize-typescript';
import { ApplicationForm } from './ApplicationForm';
import { Roll } from './Roll';
import { User } from './User';

@Table
export class Member extends Model<Member> {
    @PrimaryKey
    @AutoIncrement
    @Column
    memberId: number;

    @AllowNull(false)
    @NotNull
    @Column(DataType.STRING(12))
    name: string;

    @AllowNull(false)
    @NotNull
    @Column(DataType.STRING())
    department: string;

    @Column(DataType.INTEGER())
    studentId: string;

    @AllowNull(false)
    @NotNull
    @Column(DataType.STRING())
    phoneNumber: string;

    @Column(DataType.DATEONLY())
    birthday: Date;

    @Column
    @ForeignKey(() => ApplicationForm)
    applicationId: number;

    @HasOne(() => Roll)
    roll: Roll;

    @HasOne(() => User)
    user: User;
}
