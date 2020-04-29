import Router from '@koa/router';
import { Next, Context, DefaultState, ParameterizedContext } from 'koa';
import { User } from '../../models/User';
import { ApplicationForm } from '../../models/ApplicationForm';
import { ApplicationAcceptance} from '../../models/ApplicationAcceptance'
import { ExecutiveType } from '../../models/ExecutiveType';
import { ExecutivePermission } from '../../models/ExecutivePermission';
import { Roll } from '../../models/Roll';
import bodyParser from 'koa-bodyparser';
import { Member } from '../../models/Member';
import { FindOptions, WhereOptions, Op } from 'sequelize';
import { restrictByPermission } from './middleware';

let router = new Router<DefaultState, Context & ParameterizedContext>();
let processApplicationForm = async (form : ApplicationForm, accepter: Member, accept: boolean, reason: string = '') => {
    await ApplicationAcceptance.create({
        applicationId: form.applicationId,
        accepterId: accepter.memberId,
        accepted: accept,
        reason
    });
    if (accept) {
        if (form.reapplication) {
            await Roll.update({
                rollType: 'AssociateMember'
            }, {where: {
                name: form.name,
                studentId: form.studentId
            }});
        } else {
            let member : Member = await Member.create({
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
    let forms = await ApplicationForm.findAll({include: [{model: ApplicationAcceptance, required: false}]});
    forms = forms.filter(i => !i.acceptance)
    await ctx.render('admin/applications/forms', {forms});
});
router.get('/acceptances', restrictByPermission('applications.acceptance_list'), async (ctx: Context) => {
    let acceptances = await ApplicationAcceptance.findAll({include: ['form', 'acceptedBy']});
    await ctx.render('admin/applications/acceptances', {acceptances});
});
router.get('/form/:formId', restrictByPermission('applications.detail'), async (ctx: Context & ParameterizedContext) => {
    let form = await ApplicationForm.findByPk(ctx.params.formId);
    if (!form)
        return await ctx.throw(404, '존재하지 않는 원서입니다.');
    let acceptance = await form.$get('acceptance', {include: ['acceptedBy']});
    await ctx.render('admin/applications/form', {form, acceptance});
});
router.post('/accept', restrictByPermission('applications.accept'), bodyParser(), async (ctx: Context & ParameterizedContext) => {
    let {applicationId, accept, reason} = ctx.request.body;
    let application = await ApplicationForm.findByPk(applicationId)
    if (!application)
        return await ctx.throw(404, '존재하지 않는 원서입니다.');
    let acceptance = await application.$get('acceptance');
    if (acceptance)
        return await ctx.throw(500, '이미 처리된 원서입니다.');
    await processApplicationForm(application, await ctx.user.$get('member'), accept === 'yes', reason);
    await ctx.redirect('/admin/applications/form/' + applicationId)
    
});
router.get('/accept/:applicationId', restrictByPermission('applications.accept'), async (ctx: Context & ParameterizedContext) => {
    let application = await ApplicationForm.findByPk(ctx.params.applicationId)
    if (!application)
        return await ctx.trhow(404, '존재하지 않는 원서입니다.')
    let acceptance = await application.$get('acceptance');
    if (acceptance)
        return await ctx.throw(500, '이미 처리된 원서입니다.');
    await processApplicationForm(application, await ctx.user.$get('member'), true);
    await ctx.redirect('/admin/applications')
});
router.get('/reject/:applicationId', restrictByPermission('applications.reject'), async (ctx: Context & ParameterizedContext) => {
    let application = await ApplicationForm.findByPk(ctx.params.applicationId)
    if (!application)
        return await ctx.trhow(404, '존재하지 않는 원서입니다.')
    let acceptance = await application.$get('acceptance');
    if (acceptance)
        return await ctx.throw(500, '이미 처리된 원서입니다.');
    await processApplicationForm(application, await ctx.user.$get('member'), false);
    await ctx.redirect('/admin/applications')
});

export default router