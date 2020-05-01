import Router from '@koa/router';
import { Context, DefaultState } from 'koa';

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

export default router;
