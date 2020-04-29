import {Table, Column, Model, IsUUID, PrimaryKey, DataType, NotNull, CreatedAt, AllowNull, AutoIncrement, ForeignKey, BelongsTo, Index} from 'sequelize-typescript';

@Table
export class OidcInteraction extends Model<OidcInteraction> {
    @PrimaryKey
    @Column(DataType.STRING(180))
    id: string;

    @Column(DataType.TEXT)
    get data(): any {
        let data = this.getDataValue('data') || '{}';
        return JSON.parse(data);
    }
    set data(value: any) {
        this.setDataValue('data', JSON.stringify(value));
    }

    @Column(DataType.DATE)
    expiresAt: Date;

    @Column(DataType.DATE)
    consumedAt: Date;
}