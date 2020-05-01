import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import Provider from 'oidc-provider';
import { KoaContextWithOIDC } from 'oidc-provider/types';

export default function(provider: Provider): Router {
    const router = new Router<DefaultState, Context & KoaContextWithOIDC>();
    router.get('/interaction/:uid', async (ctx, next) => {
        const { uid, prompt, params, session } = await provider.interactionDetails(
            ctx.req,
            ctx.res
        );
        const client = await provider.Client.find(params.client_id);

        if (!ctx.user) {
            return await ctx.redirect('/login?redirect=' + encodeURIComponent(ctx.request.href));
        }

        switch (prompt.name) {
            case 'login': {
                const result = {
                    select_account: {},
                    login: {
                        account: ctx.user.id
                    }
                };

                return await provider.interactionFinished(ctx.req, ctx.res, result, {
                    mergeWithLastSubmission: false
                });
            }
            case 'consent':
                if (ctx.user.id !== session.accountId) session.accountId = ctx.user.id;
                return await provider.interactionFinished(
                    ctx.req,
                    ctx.res,
                    { consent: { rejectedClaims: [], rejectedScopes: [], replace: false } },
                    {
                        mergeWithLastSubmission: true
                    }
                );
            default:
                return await next();
        }
    });
    return router;
}
