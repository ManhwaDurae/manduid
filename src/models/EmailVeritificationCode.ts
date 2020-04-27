import {Table, Column, Model, IsUUID, PrimaryKey, NotNull, NotEmpty, DataType, AllowNull, HasOne, ForeignKey, BelongsTo} from 'sequelize-typescript';
import { Member } from './Member';

@Table
export class EmailVeritificationCode extends Model<EmailVeritificationCode> {
    @AllowNull(false)
    @NotNull
    @NotEmpty
    @PrimaryKey
    @Column(DataType.STRING(180))
    code: string;

    @AllowNull(false)
    @NotNull
    @NotEmpty
    @Column
    id: string;

    @ForeignKey(() => Member)
    @Column
    memberId: number;
    
    @AllowNull(false)
    @NotNull
    @NotEmpty
    @Column
    password: string;

    @AllowNull(false)
    @NotNull
    @NotEmpty
    @Column
    emailAddress: string;

    @Column(DataType.ENUM('bcrypt', 'sha256'))
    hashAlgorithm: HashAlgorithm;

    @BelongsTo(() => Member)
    member: Member;
}