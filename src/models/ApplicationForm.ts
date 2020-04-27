import {Table, Column, Model, IsUUID, PrimaryKey, DataType, NotNull, CreatedAt, AllowNull, AutoIncrement, Default, HasOne} from 'sequelize-typescript';
import { ApplicationAcceptance } from './ApplicationAcceptance';

@Table
export class ApplicationForm extends Model<ApplicationForm> {
    @PrimaryKey
    @AutoIncrement
    @Column
    applicationId: number;

    @Default(false)
    @Column
    reapplication : boolean

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

    @CreatedAt
    @Column(DataType.DATE())
    applicationDate: Date;

    @HasOne(() => ApplicationAcceptance)
    acceptance: ApplicationAcceptance;
}