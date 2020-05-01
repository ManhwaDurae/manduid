import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import { PasswordRecoveryCode } from '~/models/PasswordRecoveryCode';
import { User } from '~/models/User';
import email from '~/email';
import { Password } from '~/password';

const router = new Router<DefaultState, Context>();
function randomString(length: number): string {
    const availableChars = [...'zxcvbnmasdfghjklqwertyuiop0123456789'];
    let result = '';
    for (let i = 0; i < length; i++)
        result += availableChars[Math.floor(Math.random() * availableChars.length)];
    return result;
}
router.get('/', async (ctx: Context) => {
    await ctx.render('forgot_password/forgot_password');
});
router.post('/', bodyParser(), async (ctx: Context) => {
    const { email: emailAddress } = ctx.request.body;
    const user = await User.findOne({ where: { emailAddress } });
    if (user) {
        const code = randomString(30);
        await PasswordRecoveryCode.create({
            code,
            id: user.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 30)
        });

        const url = `https://id.caumd.club/forgot_password/reset?code=${code}`;
        const message = {
            from: '만화두레 <noreply@caumd.club>',
            to: emailAddress,
            subject: '비밀번호 재설정',
            text: `다음 주소에 접속해 비밀번호를 재설정해주세요: ${url}\n이 메일은 30분동안 유효합니다.\n만약 비밀번호 재설정을 한 적이 없다면 무시하세요.`,
            html: `다음 주소에 접속해 비밀번호를 재설정해주세요: <a href="${url}">${url}</a><br>이 메일은 30분동안 유효합니다.<br>만약 비밀번호 재설정을 한 적이 없다면 무시하세요.`
        };

        await email.sendMail(message);
        await ctx.render('forgot_password/email_sent');
    } else {
        return await ctx.render('forgot_password/forgot_password', {
            error: '계정을 찾을 수 없습니다.'
        });
    }
});
router.get('/reset', async (ctx: Context) => {
    const codeStr = ctx.request.query.code;
    if (typeof codeStr !== 'string') return await ctx.throw(400, '인증코드가 없습니다.');

    const code = await PasswordRecoveryCode.findByPk(codeStr);
    if (code)
        if (code.expiresAt < new Date()) {
            await code.destroy();
            return await ctx.throw(400, '무효한 코드입니다.');
        } else {
            return await ctx.render('forgot_password/reset', { code: code.code });
        }
    else return await ctx.throw(404, '이미 재설정했거나 손상된 코드입니다.');
});
router.post('/reset', bodyParser(), async (ctx: Context) => {
    const { code: codeStr, password, password_retype } = ctx.request.body;
    if (
        typeof codeStr !== 'string' ||
        typeof password !== 'string' ||
        typeof password_retype !== 'string'
    )
        return await ctx.throw(400, '잘못된 요청입니다.');

    const code = await PasswordRecoveryCode.findByPk(codeStr);
    if (code) {
        if (code.expiresAt < new Date()) {
            await code.destroy();
            return await ctx.throw(400, '무효한 코드입니다.');
        } else if (password.length < 5)
            return await ctx.render('forgot_password/reset', {
                code: code.code,
                error: '비밀번호는 최소 5글자 이상이어야 합니다.'
            });
        else if (password !== password_retype)
            return await ctx.render('forgot_password/reset', {
                code: code.code,
                error: '비밀번호가 서로 일치하지 않습니다.'
            });

        const pwd: Password = new Password(password, false);
        await User.update(
            { password: await pwd.getHash('bcrypt'), hashAlgorithm: 'bcrypt' },
            { where: { id: code.id } }
        );
        await ctx.render('forgot_password/done');
    } else return await ctx.throw(404, '이미 재설정했거나 손상된 코드입니다.');
});

export default router;
