import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import registerRouter from './register'
import { Context, DefaultState, Middleware, Next } from 'koa';
import { User } from '../../models/User';
import { Member } from '../../models/Member';
import { Roll } from '../../models/Roll';
import { Password } from '../../password';
import forgotPasswordRouter from './forgot_password';
import changePasswordRouter from './change_password'

let router = new Router<DefaultState, Context>();
router.use('/forgot_password', forgotPasswordRouter.routes());
router.use('/forgot_password', forgotPasswordRouter.allowedMethods());
router.use('/change_password', changePasswordRouter.routes());
router.use('/change_password', changePasswordRouter.allowedMethods());
router.use('/register', registerRouter.routes());
router.use('/register', registerRouter.allowedMethods());
router.get('/login', async (ctx: Context) => {
    let redirect: string = ctx.request.query['redirect'] || '/';
    if (ctx.user)
        ctx.redirect(redirect);
    else
        await ctx.render('login', {redirect});
});
router.post('/login', bodyParser(), async (ctx: Context) => {
    let redirect: string = ctx.request.body['redirect'] || '/';
    if (ctx.user)
        return ctx.redirect(redirect);
    let {id, password} = ctx.request.body;
    if (typeof id !== 'string' || typeof password !== 'string') {
        return await ctx.render('login', {redirect, error: '아이디나 비밀번호를 입력하세요.'});
    } else if (id.trim().length === 0) {
        return await ctx.render('login', {redirect, error: '아이디를 입력하세요.'});
    }
    id = id.toLowerCase();
    let user = await User.findByPk(id);
    if (user == null)
        return await ctx.render('login', {redirect, error: '아이디나 비밀번호가 잘못됐습니다.'});
    let pwd : Password = new Password(user.password, true);
    if (await pwd.compare(password, user.hashAlgorithm)) {
        let roll = (await user.$get('member', {include: ['roll']})).roll
        if (roll.rollType == 'Explusion')
            return await ctx.throw(403, '재입부신청이 필요합니다.');
        else if (roll.rollType == 'PermanentExplusion')
            return await ctx.throw(403, '제명된 회원은 로그인할 수 없습니다.');
        ctx.session.userId = user.id;
        ctx.session.save();
        return ctx.redirect(redirect);
    } else {
        return await ctx.render('login', {redirect, error: '아이디나 비밀번호가 잘못됐습니다.'});
    }
});
router.get('/logout', async (ctx: Context) => {
    let redirect: string = ctx.request.query['redirect'] || '/';
    ctx.session = null;
    return ctx.redirect('/oidc/session/end?redirect=' + encodeURIComponent(redirect));
});


let middleware : Middleware = async (ctx: Context, next: Next) => {
    if (ctx.session.userId) {
        ctx.user = await User.findByPk(ctx.session.userId);
        let rollType = (await Roll.findByPk(ctx.user.memberId)).rollType;
        let expelled = rollType == 'Explusion' || rollType == 'PermanentExplusion';
        if (expelled) {
            delete ctx.user;
            ctx.session = null;
        }
    }
    await next();
};

export {middleware, router};