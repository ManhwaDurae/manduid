import { Model } from 'sequelize-typescript';
import models from './models';

class SequelizeAdapter {
    model: typeof Model & (new () => Model);
    name: string;

    constructor(name: string) {
        this.model = models['Oidc' + name];
        this.name = name;
    }

    async upsert(id: string, data: any, expiresIn: number) {
        await this.model.upsert({
            id,
            data,
            ...(data.grantId ? { grantId: data.grantId } : undefined),
            ...(data.userCode ? { userCode: data.userCode } : undefined),
            ...(data.uid ? { uid: data.uid } : undefined),
            ...(expiresIn ? { expiresAt: new Date(Date.now() + expiresIn * 1000) } : undefined)
        });
    }

    async find(id: string) {
        const found = await this.model.findByPk(id);
        if (!found) return undefined;
        return {
            ...(found.get('data') as any),
            ...((found.get('consumedAt') as Date | null | undefined)
                ? { consumed: true }
                : undefined)
        };
    }

    async findByUserCode(userCode: string) {
        const found = await this.model.findOne({ where: { userCode } });
        if (!found) return undefined;
        return {
            ...(found.get('data') as any),
            ...((found.get('consumedAt') as Date | null | undefined)
                ? { consumed: true }
                : undefined)
        };
    }

    async findByUid(uid: string) {
        const found = await this.model.findOne({ where: { uid } });
        if (!found) return undefined;
        return {
            ...(found.get('data') as any),
            ...((found.get('consumedAt') as Date | null | undefined)
                ? { consumed: true }
                : undefined)
        };
    }

    async destroy(id: string): Promise<void> {
        await this.model.destroy({ where: { id } });
    }

    async consume(id: string): Promise<void> {
        await this.model.update({ consumedAt: new Date() }, { where: { id } });
    }

    async revokeByGrantId(grantId: string): Promise<void> {
        await this.model.destroy({ where: { grantId } });
    }

    static async connect(): Promise<void> {
        // Do nothing
    }
}

export default SequelizeAdapter;
