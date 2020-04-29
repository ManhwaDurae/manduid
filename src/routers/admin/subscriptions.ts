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
import { EmailSubscription } from '../../models/EmailSubscription';

let router = new Router<DefaultState, Context & ParameterizedContext>();
let typeDescriptions : {[index in EmailSubscriptionType]: string} = {
    'NewApplication': '입부/재입부원서 신규'
};
let getSubscriptionsWithUser = async () => await EmailSubscription.findAll({
    include: ['user']
});
router.get('/', restrictByPermission('subscriptions.list'), async (ctx) => {
    let subscriptions = await getSubscriptionsWithUser();

    await ctx.render('admin/subscriptions', {typeDescriptions, subscriptions});
});
router.get('/delete/:subscriptionId', restrictByPermission('subscriptions.delete'), async (ctx) => {
    let subscription = await EmailSubscription.findByPk(ctx.params.subscriptionId);
    if(subscription)
        await subscription.destroy();
    else
        return await ctx.throw(404, '존재하지 않는 구독입니다');
    
    await ctx.redirect('/admin/subscriptions')
});
router.post('/create', restrictByPermission('subscriptions.create'), bodyParser(), async (ctx) => {
    let {id, subscriptionType} = ctx.request.body;
    if (typeof id !== "string" || typeof subscriptionType !== "string")
        return await ctx.throw(400, '잘못된 요청입니다');
    
    await EmailSubscription.create({
        userId: id,
        subscriptionType
    });
    await ctx.redirect('/admin/subscriptions')
});

export default router