import {
    AutoIncrement,
    Column,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    DataType
} from 'sequelize-typescript';
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

    @Column(DataType.STRING) permission: Permission;
}
