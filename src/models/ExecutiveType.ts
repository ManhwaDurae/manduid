import {Table, Column, Model, IsUUID, PrimaryKey, DataType, NotNull, ForeignKey, Default, HasOne, BelongsTo, AutoIncrement, Unique, Not, HasMany} from 'sequelize-typescript';
import { ApplicationForm } from './ApplicationForm';
import { Member } from './Member';
import { notDeepEqual } from 'assert';
import { ExecutivePermission } from './ExecutivePermission';

@Table
export class ExecutiveType extends Model<ExecutiveType> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @Unique
    @Not(/^회장$/)
    @Column
    name: string;

    @Unique
    @Not(/^President$/i)
    @Column
    englishName: string;

    @HasMany(() => ExecutivePermission, 'executiveTypeId')
    permissions: ExecutivePermission[];
}