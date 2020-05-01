import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import { EmailVeritificationCode } from '~/models/EmailVeritificationCode';
import { Member } from '~/models/Member';
import { User } from '~/models/User';
import email from '~/email';
import { Password } from '~/password';

const router = new Router<DefaultState, Context>();
async function validateMember(member: Member): Promise<string> {
    const roll = await member.$get('roll');
    if (roll.rollType == 'Explusion') return '먼저 재입부신청을 해주세요.';
    else if (roll.rollType == 'PermanentExplusion') return '제명된 회원은 가입하실 수 없습니다.';
    else if (await User.findOne({ where: { memberId: member.memberId } }))
        return '이미 아이디가 존재합니다';
    return null;
}
async function isHonararyMember(member: Member): Promise<boolean> {
    const roll = await member.$get('roll');
    return roll.rollType == 'HonoraryMember';
}
function randomString(length: number): string {
    const availableChars = [...'zxcvbnmasdfghjklqwertyuiop0123456789'];
    let result = '';
    for (let i = 0; i < length; i++)
        result += availableChars[Math.floor(Math.random() * availableChars.length)];
    return result;
}
router.get('/', async (ctx: Context) => {
    await ctx.render('register_step1');
});
router.post('/', bodyParser(), async (ctx: Context) => {
    if (ctx.request.body.step !== '1' && ctx.request.body.step !== '2')
        return await ctx.render('register_step1', { error: '잘못된 요청입니다.' });
    const step = Number(ctx.request.body.step);
    if (step == 1) {
        const { name, studentId, phoneNumber } = ctx.request.body;
        if (
            typeof name !== 'string' ||
            typeof studentId !== 'string' ||
            typeof phoneNumber !== 'string'
        )
            return await ctx.render('register_step1', { error: '잘못된 요청입니다.' });
        const member = await Member.findOne({ where: { name, studentId, phoneNumber } });
        if (member == null)
            return await ctx.render('register_step1', {
                error:
                    '회원명부에서 찾을 수 없습니다. 회원이 아니시라면 다음 주소에서 입부신청해주세요: https://apply.caumd.club'
            });
        const memberError = await validateMember(member);
        if (memberError) return await ctx.throw(403, memberError);
        ctx.session.register_memberId = member.memberId;
        ctx.session.save();
        const isHonarary = await isHonararyMember(member);
        return await ctx.render('register_step2', {
            memberId: member.memberId,
            allowCauMailOnly: !isHonarary
        });
    } else if (step == 2) {
        const { id, password, password_retype, emailAddress } = ctx.request.body;
        let { memberId } = ctx.request.body;
        if (typeof memberId !== 'string')
            return await ctx.render('register_step1', {
                error: '회원확인이 제대로 이루어지지 않았습니다. 처음부터 다시 해주세요.'
            });
        else if (
            typeof id !== 'string' ||
            typeof password !== 'string' ||
            typeof password_retype !== 'string' ||
            typeof emailAddress !== 'string'
        )
            return await ctx.render('register_step2', { memberId, error: '잘못된 요청입니다.' });

        memberId = Number(memberId);
        if (memberId !== ctx.session.register_memberId)
            return await ctx.render('register_step2', {
                memberId: ctx.session.register_memberId,
                error: '세션과 폼 내용이 서로 일치하지 않습니다.'
            });

        const member = await Member.findByPk(memberId);
        if (member == null)
            return await ctx.render('register_step1', {
                error: '회원확인이 제대로 이루어지지 않습니다. 처음부터 다시 해주세요.'
            });

        // validate form

        // it's general email regex from RFC 5322 Official Standard
        // eslint-disable-next-line no-control-regex
        const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        if (/[^0-9a-zA-Z_]/.test(id))
            return await ctx.render('register_step2', {
                memberId,
                error: '아이디는 영문 대소문자, 숫자, 언더스코어(_)만 이용하실 수 있습니다.'
            });
        else if (id.length < 5)
            return await ctx.render('register_step2', {
                memberId,
                error: '아이디는 최소 5글자여야 합니다.'
            });
        else if (id.length > 30)
            return await ctx.render('register_step2', {
                memberId,
                error: '아이디는 최대 30글자까지 가능합니다.'
            });
        else if (await User.findByPk(id))
            return await ctx.render('register_step2', {
                memberId,
                error: '이미 존재하는 아이디입니다.'
            });
        if (password.length < 5)
            return await ctx.render('register_step2', {
                memberId,
                error: '비밀번호는 최소 5글자여야 합니다.'
            });
        else if (password !== password_retype)
            return await ctx.render('register_step2', {
                memberId,
                error: '비밀번호와 비밀번호 재확인이 서로 일치하지 않습니다.'
            });
        if (!emailRegex.test(emailAddress))
            return await ctx.render('register_step2', {
                memberId,
                error: '이메일 주소가 올바르지 않습니다.'
            });
        else if (!(isHonararyMember(member) || emailAddress.endsWith('@cau.ac.kr')))
            return await ctx.render('register_step2', {
                memberId,
                error: '학교 이메일 주소(@cau.ac.kr)만 이용할 수 있습니다.'
            });

        // create veritifcation code and send it
        const code = randomString(30);
        const pwd = new Password(password, false);
        await EmailVeritificationCode.create({
            code,
            id,
            memberId: member.memberId,
            password: await pwd.getHash('bcrypt'),
            emailAddress: emailAddress,
            hashAlgorithm: 'bcrypt'
        });

        const url = `https://id.caumd.club/register/verify_email?code=${code}`;
        const message = {
            from: '만화두레 <noreply@caumd.club>',
            to: emailAddress,
            subject: '이메일 인증',
            text: `다음 주소에 접속해 이메일을 인증해주세요: ${url}`,
            html: `다음 주소에 접속해 이메일을 인중해주세요: <a href="${url}">${url}</a>`
        };

        await email.sendMail(message);

        ctx.session.register_memberId = null;
        ctx.session.save();

        await ctx.render('register_emailsent');
    } else {
        return await ctx.render('register_step1', { error: '잘못된 요청입니다.' });
    }
});
router.get('/verify_email', async (ctx: Context) => {
    const codeStr = ctx.request.query.code;
    if (typeof codeStr !== 'string') return await ctx.throw(400, '인증코드가 없습니다.');
    const code = await EmailVeritificationCode.findByPk(codeStr);
    if (code == null)
        return await ctx.throw(404, '존재하지 않는 인증코드거나 이미 이메일 인증이 완료됐습니다.');

    if (await User.findByPk(code.id)) {
        await code.destroy();
        return await ctx.throw(
            500,
            '이메일 인증하는 사이 아이디를 빼았겼습니다. 다시 가입해주세요.'
        );
    }
    await User.create({
        id: code.id,
        emailAddress: code.emailAddress,
        password: code.password,
        hashAlgorithm: code.hashAlgorithm,
        memberId: code.memberId
    });

    await code.destroy();
    await ctx.render('register_veritified');
});

export default router;
