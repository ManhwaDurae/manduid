import Router from '@koa/router';
import { Context, DefaultState, ParameterizedContext } from 'koa';
import bodyParser from 'koa-bodyparser';
import { EmailSubscription } from '~/models/EmailSubscription';
import { ExecutivePermission } from '~/models/ExecutivePermission';
import { ExecutiveType } from '~/models/ExecutiveType';
import { Member } from '~/models/Member';
import { Roll } from '~/models/Roll';
import { onlyPresident, restrictByPermission } from './middleware';

const router = new Router<DefaultState, Context & ParameterizedContext>();
router.get('/handover', onlyPresident, async (ctx: Context) => {
    await ctx.render('admin/executives/handover');
});
router.post('/handover', onlyPresident, bodyParser(), async (ctx: Context) => {
    const { studentId, name, fireAllExecutives, deleteAllSubscriptions } = ctx.request.body;
    const appointed = await Member.findOne({ where: { studentId, name } });
    if (!appointed)
        return await ctx.render('admin/executives/handover', {
            error: '존재하지 않는 회원입니다.'
        });
    const appointedRoll = await appointed.$get('roll');
    if (appointedRoll.isExecutive) {
        appointedRoll.isExecutive = false;
        appointedRoll.executiveTypeId = null;
    }
    appointedRoll.isPresident = true;
    await appointedRoll.save();

    if (fireAllExecutives) {
        await Roll.update(
            { isExecutive: false, executiveTypeId: null },
            { where: { isExecutive: true } }
        );
    }
    if (deleteAllSubscriptions) {
        await EmailSubscription.truncate();
    }

    const me = await ctx.user.$get('member');
    const myRoll = await me.$get('roll');
    myRoll.isPresident = false;
    await myRoll.save();

    ctx.redirect('/');
});
router.get('/list', restrictByPermission('executives.list'), async (ctx: Context) => {
    const executives = await Roll.findAll({
        where: { isExecutive: true },
        include: ['executiveType', 'member']
    });
    const president = await Roll.findOne({ where: { isPresident: true }, include: ['member'] });
    await ctx.render('admin/executives/list', { executives, president });
});
router.get('/types', restrictByPermission('executives.types'), async (ctx: Context) => {
    const types = await ExecutiveType.findAll({ include: ['permissions'] });
    const permissions: { [index in Permission]: string } = {
        root: '모든 권한',
        executives: '운영위원 관리에 관한 모든 권한',
        'executives.list': '운영위원 목록을 조회할 수 있는 권한',
        'executives.appoint': '운영위원을 선임하거나 직책을 변경할 수 있는 권한',
        'executives.fire': '운영위원을 제명할 수 있는 권한 (회원 제명아님)',
        'executives.types':
            '운영위원 직책을 열람, 삭제, 신설하고 직책에 따른 시스템 권한을 조정할 수 있는 권한',
        applications: '입부/재입부원서 및 입부/재입부 허가내역에 관한 모든 권한',
        'applications.accept': '입부/재입부원서를 승인할 수 있는 권한',
        'applications.acceptance_list': '입부/재입부 허가내역을 열람할 수 있는 권한',
        'applications.detail': '입부/재입부원서 및 허가내역의 세부사항을 열람할 수 있는 권한',
        'applications.list': '승인/불허되지 않은 입부/재입부원서의 목록을 열람할 수 있는 권한',
        'applications.reject': '입부/재입부원서를 불허할 수 있는 권한',
        oidc: 'OPenID Connect 1.0에 관한 모든 권한',
        'oidc.create': 'OpenID Connect 1.0 Client를 생성할 수 있는 권한',
        'oidc.delete': 'OpenID Connect 1.0 Client를 삭제할 수 있는 권한',
        'oidc.list': 'OpenID Connect 1.0 Client의 목록을 볼 수 있는 권한',
        roll: '회원정보 및 명부에 관한 모든 권한',
        'roll.create': '명부에 새로운 회원을 추가해 기록할 수 있는 권한',
        'roll.list': '명부를 열람할 수 있는 권한',
        'roll.update': '명부 및 회원정보를 수정할 수 있는 권한',
        subscriptions: '이메일 구독과 관련된 모든 권한',
        'subscriptions.create': '이메일 구독을 추가할 수 있는 권한',
        'subscriptions.delete': '이메일 구독을 삭제할 수 있는 권한',
        'subscriptions.list': '이메일 구독 목록을 열람할 수 있는 권한',
        bbs: '게시판과 관련된 모든 권한',
        'bbs.ban': '게시판에서 이용자를 차단할 수 있는 권한',
        'bbs.delete': '게시판에서 게시물이나 댓글을 삭제할 수 있는 권한',
        'bbs.hide': '게시판에서 게시물이나 댓글을 숨길 수 있는 권한',
        'bbs.manage_boards': '게시판에서 게시판을 생성하거나 관리할 수 있는 권한'
    };
    await ctx.render('admin/executives/types', { types, permissions });
});
router.post(
    '/types',
    restrictByPermission('executives.types'),
    bodyParser(),
    async (ctx: Context) => {
        const { action, name, englishName, id } = ctx.request.body;
        let { permissions } = ctx.request.body;
        if (typeof permissions === 'string') permissions = [permissions];
        switch (action) {
            case 'create': {
                const newType = await ExecutiveType.create({ name, englishName });
                for (const i of permissions)
                    await ExecutivePermission.create({
                        executiveTypeId: newType.id,
                        permission: i
                    });
                break;
            }
            case 'delete': {
                const typeToDelete = await ExecutiveType.findByPk(id);
                await ExecutivePermission.destroy({ where: { executiveTypeId: typeToDelete.id } });
                await typeToDelete.destroy();
                break;
            }
            case 'update': {
                const typeToUpdate = await ExecutiveType.findByPk(id);
                typeToUpdate.name = name;
                typeToUpdate.englishName = englishName;
                await typeToUpdate.save();
                const currentPermissions = await ExecutivePermission.findAll({
                    where: { executiveTypeId: typeToUpdate.id }
                });
                for (let i = 0; i < currentPermissions.length; i++)
                    if (permissions.includes(currentPermissions[i].permission))
                        permissions.splice(
                            permissions.indexOf(currentPermissions[i].permission),
                            1
                        );
                    else await currentPermissions[i].destroy();
                for (const i of permissions)
                    await ExecutivePermission.create({
                        executiveTypeId: typeToUpdate.id,
                        permission: i
                    });
                break;
            }
            default:
                return await ctx.throw(400, '잘못된 요청입니다.');
        }
        return ctx.redirect('/admin/executives/types');
    }
);
router.get(
    '/fire/:memberId',
    restrictByPermission('executives.fire'),
    async (ctx: Context & ParameterizedContext) => {
        const roll = await Roll.findByPk(ctx.params.memberId);
        if (roll) {
            roll.isExecutive = false;
            roll.executiveTypeId = null;
            await roll.save();
        }
        ctx.redirect('/admin/executives/list');
    }
);
router.get('/appoint', restrictByPermission('executives.appoint'), async (ctx: Context) => {
    return await ctx.render('admin/executives/appoint', { types: await ExecutiveType.findAll() });
});
router.get(
    '/appoint/:memberId',
    restrictByPermission('executives.appoint'),
    async (ctx: Context & ParameterizedContext) => {
        const member = await Member.findByPk(ctx.params.memberId, { include: ['roll'] });
        if (member) {
            let type = null;
            if (member.roll.isExecutive) type = member.roll.executiveTypeId;
            return await ctx.render('admin/executives/appoint', {
                info: member,
                type,
                types: await ExecutiveType.findAll()
            });
        } else {
            ctx.redirect('/admin/executives/appoint');
        }
    }
);
router.post(
    '/appoint',
    restrictByPermission('executives.appoint'),
    bodyParser(),
    async (ctx: Context) => {
        const { studentId, name, type } = ctx.request.body;
        const member = await Member.findOne({ where: { studentId, name }, include: ['roll'] });
        const types = await ExecutiveType.findAll();
        if (!member) {
            return await ctx.render('admin/executives/appoint', {
                error: '존재하지 않는 회원입니다.',
                types
            });
        }
        member.roll.executiveTypeId = type;
        member.roll.isExecutive = true;
        await member.roll.save();
        return await ctx.render('admin/executives/appoint', { message: '임명 완료', types });
    }
);
export default router;
