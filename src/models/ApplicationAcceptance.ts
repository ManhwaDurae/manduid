import {
    BelongsTo,
    Column,
    CreatedAt,
    ForeignKey,
    Model,
    PrimaryKey,
    Table
} from 'sequelize-typescript';
import { ApplicationForm } from './ApplicationForm';
import { Member } from './Member';
import { User } from './User';

@Table
export class ApplicationAcceptance extends Model<ApplicationAcceptance> {
    @PrimaryKey
    @ForeignKey(() => ApplicationForm)
    @Column
    applicationId: number;

    @ForeignKey(() => Member)
    @Column
    accepterId: number;

    @Column accepted: boolean;

    @Column reason: string;

    @CreatedAt acceptedAt: Date;

    @BelongsTo(() => ApplicationForm)
    form: ApplicationForm;

    @BelongsTo(() => Member, 'accepterId')
    acceptedBy: User;
}
