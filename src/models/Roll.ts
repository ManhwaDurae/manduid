import {
    BelongsTo,
    Column,
    DataType,
    Default,
    ForeignKey,
    Model,
    PrimaryKey,
    Table
} from 'sequelize-typescript';
import { ExecutiveType } from './ExecutiveType';
import { Member } from './Member';

@Table
export class Roll extends Model<Roll> {
    @PrimaryKey
    @ForeignKey(() => Member)
    @Column
    memberId: number;

    @Column(
        DataType.ENUM(
            'AssociateMember',
            'RegularMember',
            'HonoraryMember',
            'Explusion',
            'PermanentExplusion'
        )
    )
    rollType: RollType;

    @Default(false)
    @Column
    isExecutive: boolean;

    @Default(false)
    @Column
    isPresident: boolean;

    @ForeignKey(() => ExecutiveType)
    @Column
    executiveTypeId: number;

    @Column(DataType.ENUM('Enrolled', 'LeaveOfAbsence', 'Graduated', 'Expelled'))
    schoolRegistration: SchoolRegistration;

    @BelongsTo(() => Member, 'memberId')
    member: Member;

    @BelongsTo(() => ExecutiveType)
    executiveType: ExecutiveType;
}
