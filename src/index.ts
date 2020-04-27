import Koa from 'koa'
import mount from 'koa-mount'
import {Sequelize} from 'sequelize-typescript'
import { join } from 'path'
import views from 'koa-views'
import session from 'koa-session'
import koaStatic from 'koa-static'
import config from './config'
import portalRouter from './routers/portal'
import adminRouter from './routers/admin'
import applyRouter from './routers/apply'
import * as authRouter from './routers/auth'
import mountProvider from './routers/oidc'
import {promises as fs} from 'fs'
import generate_keys from './routers/oidc/generate_keys'

(async () => {
    const sequelize = new Sequelize(config.databaseUri, {
        models: [__dirname + '/models', __dirname + '/models/oidc']
    })

    await sequelize.sync();

    const app = new Koa();
    
    app.keys = config.sessionSecret;
    app.use(session({
        key: 'mdsess',
        maxAge: 86400000,
        rolling: true
    }, app));
    app.use(views(join(__dirname, '../views'), {extension: 'pug', map: {'pug': 'pug'}}));
    app.use(koaStatic(join(__dirname, '../static')));
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            console.error(err);
            ctx.status = err.status || 500;
            if (err.expose)
                return await ctx.render('error', {error: err.message, status : ctx.status})
            return await ctx.render('error', {error: '서버 내부 오류가 발생했습니다', status : ctx.status});
        }
    });
    app.use(authRouter.middleware);
    app.use(authRouter.router.routes());
    app.use(authRouter.router.allowedMethods());
    app.use(portalRouter.routes());
    app.use(portalRouter.allowedMethods());
    app.use(mount('/apply', applyRouter.routes()));
    app.use(mount('/apply', applyRouter.allowedMethods()));
    app.use(mount('/admin', adminRouter.routes()));
    app.use(mount('/admin', adminRouter.allowedMethods()));
    app.listen(config.httpPort, () => {
        console.log(`Listening on ${config.httpPort}`);
    });
    let jwksPath = join(process.cwd(), 'oidc_keys.json');
    try {
        await fs.stat(jwksPath);
    } catch (err) {
        if(err.code == 'ENOENT') {
            await generate_keys(jwksPath);
        }
    }
    let jwks = JSON.parse(await fs.readFile(jwksPath, 'utf8'));
    mountProvider(app, {
        jwks,
        url: 'https://id.caumd.club'
    });
})();