import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import ProfileRouter from './profile';
import avatarServer from './avatar';

const router = new Router<DefaultState, Context>();
router.get('/', async (ctx: Context) => {
    const user = ctx.user;
    if (user) {
        const roll = await (await ctx.user.$get('member')).$get('roll');
        await ctx.render('index', {
            user: ctx.user,
            isExecutive: roll.isExecutive,
            executiveName: roll.isExecutive ? (await roll.$get('executiveType')).name : '',
            isPresident: roll.isPresident
        });
    } else {
        await ctx.render('index', { user: null });
    }
});
router.use('/avatar', avatarServer.routes());
router.use('/profile', async (ctx, next) => {
    if (!ctx.user) {
        return ctx.redirect('/login?redirect=' + encodeURIComponent(ctx.request.href));
    }
    await next();
});
router.use('/profile', ProfileRouter.routes());
router.use('/profile', ProfileRouter.allowedMethods());

export default router;
