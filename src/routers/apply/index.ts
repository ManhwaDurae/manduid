import Router from '@koa/router'
import { Next, Context, DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import { Member } from '../../models/Member';
import { ApplicationForm } from '../../models/ApplicationForm';
import { Roll } from '../../models/Roll';
import { User } from '../../models/User';
import email from '../../email'
import { EmailSubscription } from '../../models/EmailSubscription';

let router = new Router<DefaultState, Context>();
router.get('/', async (ctx: Context) => {
    await ctx.render('apply');
});
router.post('/', bodyParser(), async (ctx: Context) => {
    let {birthday, department, name, phoneNumber, studentId} = <memberFormFields>ctx.request.body;
    let member = await Member.findOne({where:{studentId}, include: ['roll']})
    let reapplication = false;
    if (typeof birthday !== "string" || typeof department !== "string" || typeof name !== "string" || typeof phoneNumber !== "string" || typeof studentId !== "string")
        return await ctx.render('apply', {error: '누락된 항목이 있습니다.'});
    if (member) {
       if (member.roll.rollType == 'Explusion')
            reapplication = true;
        else if (member.roll.rollType == 'PermanentExplusion')
            return await ctx.throw(403, '제명된 회원은 온라인으로 입부신청할 수 없습니다. 회장에게 문의하세요.');
        else
            return await ctx.render('apply', {error: '이미 회원이십니다. 아이디가 필요하다면 회원가입을 해주세요.'});
    }
    if (await ApplicationForm.findOne({where: {studentId}}))
        return await ctx.render('apply', {error: '이미 신청하셨습니다.'});

    let form = await ApplicationForm.create({birthday, department, name, phoneNumber, studentId, reapplication});
    await ctx.render('applied', {reapplication});

    for (let i of await EmailSubscription.findAll({where:{subscriptionType: 'NewApplication'}, include: ['user']})) {
        let emailAddress = i.user.emailAddress;
        let url = `https://id.caumd.club/admin/applications/form/${form.applicationId}`
        let reapplicationPrefix = reapplication ? '재' : ''
        let message = {
            from: '만화두레 <noreply@caumd.club>',
            to: emailAddress,
            subject: `만화두레 ${reapplicationPrefix}입부원서 접수`,
            text: `다음 주소에서 확인해주세요 : ${url}`,
            html: `다음 주소에서 확인해주세요: <a href="${url}">${url}</a>`
        };
        
        email.sendMail(message).catch(err => {
            console.error('Error while sending email')
            console.error(err);
        }); // Do not wait for sending email but logs error if happens
    }
});

export default router;