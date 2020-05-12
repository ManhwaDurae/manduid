import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import storage from './avatarStorage';

const router = new Router<DefaultState, Context>();
router.get('/:hash', async ctx => {
    const hash = ctx.params.hash;
    if ((await storage.has(hash)) && ctx.request.query.fallback !== 'yes') {
        ctx.body = await storage.get(hash);
    } else {
        ctx.redirect(storage.getFallbackUrl(hash));
    }
});

export default router;
