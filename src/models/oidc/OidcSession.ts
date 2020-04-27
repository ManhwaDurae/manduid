import {Table, Column, Model, IsUUID, PrimaryKey, DataType, NotNull, CreatedAt, AllowNull, AutoIncrement, ForeignKey, BelongsTo, Index} from 'sequelize-typescript';

@Table
export class OidcSession extends Model<OidcSession> {
    @PrimaryKey
    @Column
    id: string;

    @Index
    @Column
    uid: string;

    @Column(DataType.JSON)
    data: any;

    @Column(DataType.DATE)
    expiresAt: Date;

    @Column(DataType.DATE)
    consumedAt: Date;
}