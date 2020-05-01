import { Context, Next } from 'koa';
import { ExecutivePermission } from '~/models/ExecutivePermission';
import { User } from '~/models/User';

export async function checkPermission(user: User, permission: Permission): Promise<boolean> {
    const roll = await (await user.$get('member')).$get('roll');
    if (roll.isPresident) return true;
    if (roll.isExecutive) {
        const executiveType = await roll.$get('executiveType', { include: ['permissions'] });
        const legalPermissions = permission.split('.');
        for (let i = 1; i < legalPermissions.length; i++)
            legalPermissions[i] = legalPermissions[i - 1] + '.' + legalPermissions[i];
        if (
            executiveType.permissions.some(
                (i: ExecutivePermission) =>
                    legalPermissions.includes(i.permission) || i.permission == 'root'
            )
        )
            return true;
    }
    return false;
}
export function restrictByPermission(permission: Permission) {
    return async (ctx: Context, next: Next): Promise<void> => {
        const hasPermission = await checkPermission(ctx.user, permission);
        if (hasPermission) return await next();
        return await ctx.throw(403, '권한이 없습니다. 필요한 권한 : ' + permission);
    };
}
export async function onlyPresident(ctx: Context, next: Next): Promise<void> {
    const roll = await (await ctx.user.$get('member')).$get('roll');
    if (roll.isPresident) return await next();
    else return await ctx.throw('회장만 접근할 수 있습니다.', 403);
}
