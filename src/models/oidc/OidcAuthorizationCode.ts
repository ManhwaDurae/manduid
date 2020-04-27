import {Table, Column, Model, IsUUID, PrimaryKey, DataType, NotNull, CreatedAt, AllowNull, AutoIncrement, ForeignKey, BelongsTo, Index} from 'sequelize-typescript';

@Table
export class OidcAuthorizationCode extends Model<OidcAuthorizationCode> {
    @PrimaryKey
    @Column(DataType.STRING(180))
    id: string;

    @Index
    @Column
    grantId: string;

    @Column(DataType.TEXT)
    get data(): any {
        return JSON.parse(this.getDataValue('data'));
    }
    set data(value: any) {
        this.setDataValue('data', JSON.stringify(value));
    }

    @Column(DataType.DATE)
    expiresAt: Date;

    @Column(DataType.DATE)
    consumedAt: Date;
}