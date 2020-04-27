import Router from '@koa/router'
import { Next, Context, DefaultState } from 'koa';

let router = new Router<DefaultState, Context>();
router.get('/', async (ctx: Context) => {
    let user = ctx.user;
    if (user) {
        let roll = (await (await ctx.user.$get('member')).$get('roll'));
        await ctx.render('index', {user: ctx.user, isExecutive: roll.isExecutive, executiveName: roll.isExecutive ? (await roll.$get('executiveType')).name : '' ,isPresident: roll.isPresident});
    } else {
        await ctx.render('index', {user: null});
    }
});

export default router;