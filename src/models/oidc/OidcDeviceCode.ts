import { Column, DataType, Index, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class OidcDeviceCode extends Model<OidcDeviceCode> {
    @PrimaryKey
    @Column(DataType.STRING(180))
    id: string;

    @Index
    @Column
    grantId: string;

    @Column(DataType.TEXT)
    get data(): any {
        const data = this.getDataValue('data') || '{}';
        return JSON.parse(data);
    }
    set data(value: any) {
        this.setDataValue('data', JSON.stringify(value));
    }

    @Column(DataType.DATE) expiresAt: Date;

    @Column(DataType.DATE) consumedAt: Date;
}
