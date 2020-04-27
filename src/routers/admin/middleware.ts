import { Next, Context, DefaultState, Middleware } from 'koa';
import { User } from '../../models/User';
import { ExecutiveType } from '../../models/ExecutiveType';
import { ExecutivePermission } from '../../models/ExecutivePermission';

export function checkPermission (permission: Permission) {
    return async (ctx: Context, next: Next) => {
        let roll = await (await ctx.user.$get('member')).$get('roll')
        if(roll.isPresident)
            return await next();
        if(roll.isExecutive) {
            let executiveType = await roll.$get('executiveType', {include: ['permissions']});
            let legalPermissions = permission.split('.');
            for (let i = 1; i < legalPermissions.length; i++)
                legalPermissions[i] = legalPermissions[i-1] + '.' + legalPermissions[i];
           if (executiveType.permissions.some((i : ExecutivePermission) => (legalPermissions.includes(i.permission) || i.permission == 'root')))
                return await next();
        }
        ctx.response.status = 403;
        return await ctx.throw(403, '권한이 없습니다. 필요한 권한 : ' + permission);
    };
}
export async function onlyPresident (ctx: Context, next: Next) {
    let roll = await (await ctx.user.$get('member')).$get('roll')
    if (roll.isPresident)
        return await next();
    else
        return await ctx.throw('회장만 접근할 수 있습니다.', 403);
}