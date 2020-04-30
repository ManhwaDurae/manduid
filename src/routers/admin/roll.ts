import Router from '@koa/router';
import { Next, Context, DefaultState, ParameterizedContext } from 'koa';
import { User } from '../../models/User';
import { ExecutiveType } from '../../models/ExecutiveType';
import { ExecutivePermission } from '../../models/ExecutivePermission';
import { Roll } from '../../models/Roll';
import bodyParser from 'koa-bodyparser';
import { Member } from '../../models/Member';
import { FindOptions, WhereOptions, Op, IncludeOptions } from 'sequelize';
import { restrictByPermission } from './middleware';

let router = new Router<DefaultState, Context & ParameterizedContext>();

router.get('/', restrictByPermission('roll.list'), async (ctx: Context) => {
    let {schoolRegistration, query, query_type, rolls, limit, page} = ctx.request.query;
    let findOptions : FindOptions = {where: {}};
    let where : WhereOptions = {};

    // default value
    if (!limit)
        limit = 15;
    if (!page)
        page = 1;
    
    // always as array of string
    if (typeof schoolRegistration === 'string')
        schoolRegistration = [schoolRegistration];
    if (typeof rolls === 'string')
        rolls = [rolls];
    
    if (schoolRegistration)
        where.schoolRegistration = {[Op.or] : schoolRegistration};
    else
        schoolRegistration = [];
    if (rolls) 
        where.rollType = {[Op.or] : rolls};
    else
        rolls = [];
    if (query_type === "userId" && typeof query === "string" && query.trim().length != 0) {
        let include : IncludeOptions = {
            model: Member,
            include: [{
                model: User,
                where: {
                    id: query
                }
            }]
        };
        findOptions.include = [include];
    } else if (typeof query === "string" && query.trim().length != 0) {
        let includeWhere : WhereOptions = {};
        includeWhere[query_type] = {[Op.like]: '%' + query + '%'};
        findOptions.include = [{
            model: Member,
            where: includeWhere
        }];
    } else {
        findOptions.include = ['member'];
        query = '';
        query_type = null;
    }
    findOptions.where = where;
    let count = await Roll.count(findOptions);
    let pages = Math.ceil(count / limit),
        offset = (page - 1) * limit;
    findOptions.limit = limit;
    findOptions.offset = offset;
    let result = await Roll.findAll(findOptions);
    await ctx.render('admin/roll', {pages, page, limit, roll: result, searchInfo : {query, query_type, rolls, schoolRegistration}});
});
router.get('/new', restrictByPermission('roll.create'), async (ctx : Context) => {
    await ctx.render('admin/roll_fields', {add_member: true});
});
router.post('/new', restrictByPermission('roll.create'), bodyParser(), async (ctx: Context) => {
    let {name, studentId, department, birthday, phoneNumber, roll: rollType, schoolRegistration} = <memberFormFields & rollFormFields>ctx.request.body;
    let member = await Member.create({name, studentId, department, birthday: new Date(birthday), phoneNumber});
    let roll = await Roll.create({rollType, schoolRegistration, memberId: member.memberId});
    if (roll) {
        await ctx.render('admin/roll_fields', {add_member: true, message: '추가 완료'});
    } else {
        await ctx.render('admin/roll_fields', {add_member: true, error: '추가 실패'});
    }
});
router.get('/update/:memberId', restrictByPermission('roll.update'), async (ctx: Context & ParameterizedContext) => {
    let roll = await Roll.findByPk(ctx.params.memberId);
    if (!roll)
        await ctx.throw(403, '존재하지 않는 회원입니다.');
    let member = await roll.$get('member');
    await ctx.render('admin/roll_fields', {roll, member});
});
router.post('/update/:memberId', restrictByPermission('roll.update'), bodyParser(), async (ctx: Context & ParameterizedContext) => {
    let {name, studentId, department, birthday, phoneNumber, roll: rollType, schoolRegistration} = <memberFormFields & rollFormFields>ctx.request.body;
    let roll = await Roll.findByPk(ctx.params.memberId);
    if (!roll)
        await ctx.throw(403, '존재하지 않는 회원입니다.');
    let member = await roll.$get('member');
    roll.rollType = rollType;
    roll.schoolRegistration = schoolRegistration;
    member.name = name;
    member.studentId = studentId;
    member.department = department;
    member.birthday = new Date(birthday);
    member.phoneNumber = phoneNumber;
    
    await roll.save();
    await member.save();

    await ctx.render('admin/roll_fields', {roll, member, message: '수정 완료'});
});

export default router;