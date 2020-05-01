import Router from '@koa/router';
import { Context, DefaultState, ParameterizedContext } from 'koa';
import bodyParser from 'koa-bodyparser';
import { ApplicationAcceptance } from '~/models/ApplicationAcceptance';
import { ApplicationForm } from '~/models/ApplicationForm';
import { Member } from '~/models/Member';
import { Roll } from '~/models/Roll';
import { restrictByPermission } from './middleware';

const router = new Router<DefaultState, Context & ParameterizedContext>();
const processApplicationForm = async (
    form: ApplicationForm,
    accepter: Member,
    accept: boolean,
    reason = ''
): Promise<void> => {
    await ApplicationAcceptance.create({
        applicationId: form.applicationId,
        accepterId: accepter.memberId,
        accepted: accept,
        reason
    });
    if (accept) {
        if (form.reapplication) {
            await Roll.update(
                {
                    rollType: 'AssociateMember'
                },
                {
                    where: {
                        name: form.name,
                        studentId: form.studentId
                    }
                }
            );
        } else {
            const member: Member = await Member.create({
                name: form.name,
                studentId: form.studentId,
                department: form.department,
                phoneNumber: form.phoneNumber,
                birthday: form.birthday,
                applicationId: form.applicationId
            });
            await Roll.create({
                memberId: member.memberId,
                rollType: 'AssociateMember',
                schoolRegistration: 'Enrolled'
            });
        }
    }
};
router.get('/', restrictByPermission('applications.list'), async (ctx: Context) => {
    let forms = await ApplicationForm.findAll({
        include: [{ model: ApplicationAcceptance, required: false }]
    });
    forms = forms.filter(i => !i.acceptance);
    await ctx.render('admin/applications/forms', { forms });
});
router.get(
    '/acceptances',
    restrictByPermission('applications.acceptance_list'),
    async (ctx: Context) => {
        const acceptances = await ApplicationAcceptance.findAll({
            include: ['form', 'acceptedBy']
        });
        await ctx.render('admin/applications/acceptances', { acceptances });
    }
);
router.get(
    '/form/:formId',
    restrictByPermission('applications.detail'),
    async (ctx: Context & ParameterizedContext) => {
        const form = await ApplicationForm.findByPk(ctx.params.formId);
        if (!form) return await ctx.throw(404, '존재하지 않는 원서입니다.');
        const acceptance = await form.$get('acceptance', { include: ['acceptedBy'] });
        await ctx.render('admin/applications/form', { form, acceptance });
    }
);
router.post(
    '/accept',
    restrictByPermission('applications.accept'),
    bodyParser(),
    async (ctx: Context & ParameterizedContext) => {
        const { applicationId, accept, reason } = ctx.request.body;
        const application = await ApplicationForm.findByPk(applicationId);
        if (!application) return await ctx.throw(404, '존재하지 않는 원서입니다.');
        const acceptance = await application.$get('acceptance');
        if (acceptance) return await ctx.throw(500, '이미 처리된 원서입니다.');
        await processApplicationForm(
            application,
            await ctx.user.$get('member'),
            accept === 'yes',
            reason
        );
        await ctx.redirect('/admin/applications/form/' + applicationId);
    }
);
router.get(
    '/accept/:applicationId',
    restrictByPermission('applications.accept'),
    async (ctx: Context & ParameterizedContext) => {
        const application = await ApplicationForm.findByPk(ctx.params.applicationId);
        if (!application) return await ctx.trhow(404, '존재하지 않는 원서입니다.');
        const acceptance = await application.$get('acceptance');
        if (acceptance) return await ctx.throw(500, '이미 처리된 원서입니다.');
        await processApplicationForm(application, await ctx.user.$get('member'), true);
        await ctx.redirect('/admin/applications');
    }
);
router.get(
    '/reject/:applicationId',
    restrictByPermission('applications.reject'),
    async (ctx: Context & ParameterizedContext) => {
        const application = await ApplicationForm.findByPk(ctx.params.applicationId);
        if (!application) return await ctx.trhow(404, '존재하지 않는 원서입니다.');
        const acceptance = await application.$get('acceptance');
        if (acceptance) return await ctx.throw(500, '이미 처리된 원서입니다.');
        await processApplicationForm(application, await ctx.user.$get('member'), false);
        await ctx.redirect('/admin/applications');
    }
);

export default router;
