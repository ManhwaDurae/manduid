import Router from '@koa/router';
import { Context, DefaultState, Next } from 'koa';
import { Roll } from '~/models/Roll';
import applicationRouter from './applications';
import executivesRouter from './executives';
import oidcRouter from './oidc';
import rollRouter from './roll';
import subscriptionsRouter from './subscriptions';

const router = new Router<DefaultState, Context>();

router.use(async (ctx: Context, next: Next) => {
    if (!ctx.user)
        return await ctx.redirect('/login?redirect=' + encodeURIComponent(ctx.request.href));
    const roll = await (await ctx.user.$get('member')).$get('roll');
    if (!roll.isExecutive && !roll.isPresident) {
        return await ctx.throw(403, '운영위원이 아닙니다.');
    }
    await next();
});
router.get('/', async (ctx: Context) => {
    const roll = await Roll.findByPk(ctx.user.memberId);
    let executiveType = null,
        root = false;
    if (roll.isExecutive)
        executiveType = await roll.$get('executiveType', { include: ['permissions'] });
    if (executiveType) root = executiveType.permissions.some(i => i.permission === 'root');
    await ctx.render('admin/index', { isPresident: roll.isPresident, executiveType, root });
});

router.use('/roll', rollRouter.routes());
router.use('/roll', rollRouter.allowedMethods());
router.use('/applications', applicationRouter.routes());
router.use('/applications', applicationRouter.allowedMethods());
router.use('/oidc', oidcRouter.routes());
router.use('/oidc', router.allowedMethods());
router.use('/executives', executivesRouter.routes());
router.use('/executives', executivesRouter.allowedMethods());
router.use('/subscriptions', subscriptionsRouter.routes());
router.use('/subscriptions', subscriptionsRouter.allowedMethods());

export default router;
