import {
    AutoIncrement,
    Column,
    DataType,
    HasMany,
    Model,
    Not,
    PrimaryKey,
    Table,
    Unique
} from 'sequelize-typescript';
import { ExecutivePermission } from './ExecutivePermission';

@Table
export class ExecutiveType extends Model<ExecutiveType> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @Unique
    @Not(/^회장$/)
    @Column(DataType.STRING(180))
    name: string;

    @Unique
    @Not(/^President$/i)
    @Column(DataType.STRING(180))
    englishName: string;

    @HasMany(() => ExecutivePermission, 'executiveTypeId')
    permissions: ExecutivePermission[];
}
