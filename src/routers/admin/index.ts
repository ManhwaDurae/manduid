import Router from '@koa/router'
import { Next, Context, DefaultState } from 'koa';
import { User } from '../../models/User';
import { ExecutiveType } from '../../models/ExecutiveType';
import { ExecutivePermission } from '../../models/ExecutivePermission';
import oidcRouter from "./oidc";
import applicationRouter from './applications'
import rollRouter from './roll'
import executivesRouter from './executives'
import subscriptionsRouter from './subscriptions'
import { Roll } from '../../models/Roll';

let router = new Router<DefaultState, Context>();

router.use(async (ctx: Context, next: Next) => {
    if(!ctx.user)
        return await ctx.redirect('/login?redirect=' + encodeURIComponent(ctx.request.href))
    let roll = await (await ctx.user.$get('member')).$get('roll')
    if(!roll.isExecutive && !roll.isPresident) {
        ctx.response.status = 403;
        return await ctx.throw(403, '운영위원이 아닙니다.');
    }
    await next();
});
router.get('/', async (ctx: Context) => {
    let roll = await Roll.findByPk(ctx.user.memberId);
    let executiveType = null, root = false;
    if (roll.isExecutive)
        executiveType = await roll.$get('executiveType',{include:['permissions']});
    if (executiveType)
        root = executiveType.permissions.some(i => i.permission === "root");
    await ctx.render('admin/index', {isPresident: roll.isPresident, executiveType, root});
});

router.use('/roll', rollRouter.routes())
router.use('/roll', rollRouter.allowedMethods())
router.use('/applications', applicationRouter.routes());
router.use('/applications', applicationRouter.allowedMethods());
router.use('/oidc', oidcRouter.routes());
router.use('/oidc', router.allowedMethods());
router.use('/executives', executivesRouter.routes());
router.use('/executives', executivesRouter.allowedMethods());
router.use('/subscriptions', subscriptionsRouter.routes());
router.use('/subscriptions', subscriptionsRouter.allowedMethods());

export default router;