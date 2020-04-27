import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { Context, DefaultState, Middleware, Next, ParameterizedContext } from 'koa';
import { User } from '../../models/User';
import { Password } from '../../password';
import Provider from 'oidc-provider';
import { KoaContextWithOIDC } from "oidc-provider/types";

export default function (provider: Provider) : Router {

    let router = new Router<DefaultState, Context & KoaContextWithOIDC>();
    router.get('/interaction/:uid', async (ctx, next) => {
        const {
          uid, prompt, params, session,
        } = await provider.interactionDetails(ctx.req, ctx.res);
        const client = await provider.Client.find(params.client_id);
    
        switch (prompt.name) {
          case 'login': 
            if (ctx.user) {
                const result = {
                    select_account: {},
                    login: {
                        account: ctx.user.id,
                    },
                };
            
                return await provider.interactionFinished(ctx.req, ctx.res, result, {
                    mergeWithLastSubmission: false,
                });

            } else {
                return await ctx.redirect('/login?redirect=' + encodeURIComponent(ctx.request.href));
            }
          case 'consent': 
            return await provider.interactionFinished(ctx.req, ctx.res, {consent:{rejectedClaims: [], rejectedScopes: [], replace: false}}, {
                mergeWithLastSubmission: true,
            });
          
          default:
            return await next();
        }
    });
    return router;
};