import {Table, Column, Model, IsUUID, PrimaryKey, DataType, NotNull, ForeignKey, Default, HasOne, BelongsTo, AutoIncrement} from 'sequelize-typescript';
import { ApplicationForm } from './ApplicationForm';
import { Member } from './Member';
import { ExecutiveType } from './ExecutiveType';

@Table
export class ExecutivePermission extends Model<ExecutivePermission> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @ForeignKey(() => ExecutiveType)
    @Column
    executiveTypeId: number;

    @Column
    permission: string;
}