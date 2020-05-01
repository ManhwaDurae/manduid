import Router from '@koa/router';
import { Context, DefaultState, ParameterizedContext } from 'koa';
import bodyParser from 'koa-bodyparser';
import { EmailSubscription } from '~/models/EmailSubscription';
import { restrictByPermission } from './middleware';

const router = new Router<DefaultState, Context & ParameterizedContext>();
const typeDescriptions: { [index in EmailSubscriptionType]: string } = {
    NewApplication: '입부/재입부원서 신규'
};
const getSubscriptionsWithUser = async (): Promise<EmailSubscription[]> =>
    await EmailSubscription.findAll({
        include: ['user']
    });
router.get('/', restrictByPermission('subscriptions.list'), async ctx => {
    const subscriptions = await getSubscriptionsWithUser();

    await ctx.render('admin/subscriptions', { typeDescriptions, subscriptions });
});
router.get('/delete/:subscriptionId', restrictByPermission('subscriptions.delete'), async ctx => {
    const subscription = await EmailSubscription.findByPk(ctx.params.subscriptionId);
    if (subscription) await subscription.destroy();
    else return await ctx.throw(404, '존재하지 않는 구독입니다');

    await ctx.redirect('/admin/subscriptions');
});
router.post('/create', restrictByPermission('subscriptions.create'), bodyParser(), async ctx => {
    const { id, subscriptionType } = ctx.request.body;
    if (typeof id !== 'string' || typeof subscriptionType !== 'string')
        return await ctx.throw(400, '잘못된 요청입니다');

    await EmailSubscription.create({
        userId: id,
        subscriptionType
    });
    await ctx.redirect('/admin/subscriptions');
});

export default router;
