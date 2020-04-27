import models from './models'
import { Model } from 'sequelize-typescript';
import { OidcDeviceCode } from '../../../models/oidc/OidcDeviceCode';

class SequelizeAdapter {
    model: typeof Model & (new () => Model);
    name: string;

    constructor(name : string) {
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
        ...(expiresIn ? { expiresAt: new Date(Date.now() + (expiresIn * 1000)) } : undefined),
      });
    }
  
    async find(id : string) {
      const found = await this.model.findByPk(id);
      if (!found) return undefined;
      return {
        ...<any>found.get('data'),
        ...(<Date | null | undefined>found.get('consumedAt') ? { consumed: true } : undefined),
      };
    }
  
    async findByUserCode(userCode: string) {
      const found = await this.model.findOne({ where: { userCode } });
      if (!found) return undefined;
      return {
        ...<any>found.get('data'),
        ...(<Date | null | undefined>found.get('consumedAt') ? { consumed: true } : undefined),
      };
    }
  
    async findByUid(uid: string) {
      const found = await this.model.findOne({ where: { uid } });
      if (!found) return undefined;
      return {
        ...<any>found.get('data'),
        ...(<Date | null | undefined>found.get('consumedAt') ? { consumed: true } : undefined),
      };
    }
  
    async destroy(id: string) {
      await this.model.destroy({ where: { id } });
    }
  
    async consume(id: string) {
      await this.model.update({ consumedAt: new Date() }, { where: { id } });
    }
  
    async revokeByGrantId(grantId: string) {
      await this.model.destroy({ where: { grantId } });
    }
  
    static async connect() {
      // Do nothing
    }
  }

  export default SequelizeAdapter;