import {Table, Column, Model, IsUUID, PrimaryKey, DataType, NotNull, CreatedAt, AllowNull, AutoIncrement, ForeignKey, BelongsTo} from 'sequelize-typescript';
import { User } from './User';
import { ApplicationForm } from './ApplicationForm';
import { Member } from './Member';

@Table
export class ApplicationAcceptance extends Model<ApplicationAcceptance> {
    @PrimaryKey
    @ForeignKey(() => ApplicationForm)
    @Column
    applicationId: number;

    @ForeignKey(() => Member)
    @Column
    accepterId: number;

    @Column
    accepted: boolean;

    @Column
    reason: string;

    @CreatedAt
    acceptedAt: Date;

    @BelongsTo(() => ApplicationForm)
    form: ApplicationForm;

    @BelongsTo(() => Member, 'accepterId')
    acceptedBy: User;
}