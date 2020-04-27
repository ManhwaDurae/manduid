import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import registerRouter from './register'
import { Context, DefaultState, Middleware, Next } from 'koa';
import { User } from '../../models/User';
import { Member } from '../../models/Member';
import { Roll } from '../../models/Roll';
import { Password } from '../../password';
import forgotPasswordRouter from './forgot_password';

let router = new Router<DefaultState, Context>();
router.get('/', async (ctx: Context) => {
    if (ctx.user) {
        await ctx.render('reset_password');
    } else {
        ctx.redirect('/');
    }
});
router.post('/', bodyParser(), async (ctx: Context) => {
    let {password, new_password, new_password_retype} = ctx.request.body;
    if (typeof password !== "string" || typeof new_password !== "string" || typeof new_password_retype !== "string")
        return await ctx.render('reset_password', {error: '잘못된 요청입니다.'});
    let currentPassword : Password = new Password(ctx.user.password, true);
    let passwordCorrect = await currentPassword.compare(password, ctx.user.hashAlgorithm);
    if (!passwordCorrect)
        return await ctx.render('reset_password', {error: '현재 비밀번호가 올바르지 않습니다.'});
    else if (new_password.length < 5)
        return await ctx.render('reset_password', {error: '비밀번호는 최소 5자 이상이어야 합니다.'});
    else if (new_password != new_password_retype)
        return await ctx.render('reset_password', {error: '비밀번호가 서로 일치하지 않습니다.'});
    let newPassowrd: Password = new Password(new_password, false);
    ctx.user.password = await newPassowrd.getHash('bcrypt');
    ctx.user.hashAlgorithm = 'bcrypt';
    await ctx.user.save();
    await ctx.render('reset_password', {message: '변경됐습니다.'});
});

export default router;