import Router from '@koa/router';
import ExcelJs from 'exceljs';
import fs from 'fs';
import { Context, DefaultState, ParameterizedContext } from 'koa';
import bodyParser from 'koa-bodyparser';
import { FindOptions, IncludeOptions, Op, WhereOptions } from 'sequelize';
import { Stream } from 'stream';
import tempy from 'tempy';
import { ExecutiveType } from '~/models/ExecutiveType';
import { Member } from '~/models/Member';
import { Roll } from '~/models/Roll';
import { User } from '~/models/User';
import config from '~/config';
import { restrictByPermission } from './middleware';

const router = new Router<DefaultState, Context & ParameterizedContext>();

const rollDisplayNames: { [index in RollType]: string } = {
    AssociateMember: '준회원',
    RegularMember: '정회원',
    HonoraryMember: '명예회원',
    Explusion: '제적',
    PermanentExplusion: '제명'
};
const schoolRegistrationDisplayNames: { [index in SchoolRegistration]: string } = {
    Enrolled: '재학',
    LeaveOfAbsence: '휴학',
    Graduated: '졸업',
    Expelled: '제적'
};

function excelColNameToNumber(colName: string): number {
    colName = colName.toUpperCase();

    let sum = 0;

    for (let i = 0; i < colName.length; i++) {
        sum *= 26;
        sum += colName[i].charCodeAt(i) - 'A'.charCodeAt(0) + 1;
    }

    return sum;
}

type SearchConditions = {
    schoolRegistration: SchoolRegistration[];
    rolls: RollType[];
    query_type: string;
    query: string;
};
async function constructXlsx(
    result: Roll[],
    searchConditions: SearchConditions,
    searcher: Member,
    searchDate: Date,
    stream: Stream
): Promise<void> {
    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.readFile(config.xlsxTemplate.path);
    const worksheet = workbook.getWorksheet(config.xlsxTemplate.sheetName);

    // Insert search info
    worksheet.getCell(config.xlsxTemplate.searchInfo.searcher).value = searcher.name;
    worksheet.getCell(config.xlsxTemplate.searchInfo.searcher).value = searcher.name;
    worksheet.getCell(config.xlsxTemplate.searchInfo.searchDate).value = searchDate;
    worksheet.getCell(config.xlsxTemplate.searchInfo.resultCount).value = result.length;

    // Insert search conditions
    const queryTypeDescriptions: { [index: string]: string } = {
        name: '이름',
        studentId: '학번',
        phoneNumber: '전화번호',
        department: '학과',
        userId: '계정 아이디'
    };
    worksheet.getCell(config.xlsxTemplate.searchConditions.query_type).value =
        queryTypeDescriptions[searchConditions.query_type] || '';
    worksheet.getCell(config.xlsxTemplate.searchConditions.query).value =
        searchConditions.query || '';
    worksheet.getCell(config.xlsxTemplate.searchConditions.rolls).value =
        searchConditions.rolls.length == 0
            ? '전체'
            : searchConditions.rolls.map(i => rollDisplayNames[i]).join(', ');
    worksheet.getCell(config.xlsxTemplate.searchConditions.schoolRegistrations).value =
        searchConditions.schoolRegistration.length == 0
            ? '전체'
            : searchConditions.schoolRegistration
                  .map(i => schoolRegistrationDisplayNames[i])
                  .join(', ');

    // Insert result
    let rowNow = Number(/[a-zA-Z]+([0-9]+)/.exec(config.xlsxTemplate.result.start)[1]);
    const startCol = excelColNameToNumber(/([a-zA-Z]+)/.exec(config.xlsxTemplate.result.start)[1]);
    let firstRow = true;
    for (const i of result) {
        const user = await i.member.$get('user');
        let executiveName = '';
        if (i.executiveType) executiveName = i.executiveType.name;
        else if (i.isPresident) executiveName = '회장';

        let colNow = startCol;
        for (const j of config.xlsxTemplate.result.order) {
            const cellNow = worksheet.getCell(rowNow, colNow);
            if (!firstRow) {
                const styleTemplateCell = worksheet.getCell(rowNow - 1, colNow);
                cellNow.style = styleTemplateCell.style;
            }
            switch (j) {
                case 'accountId':
                    if (user) cellNow.value = user.id;
                    break;
                case 'birthday':
                    cellNow.value = i.member.birthday;
                    break;
                case 'department':
                    cellNow.value = i.member.department;
                    break;
                case 'executiveName':
                    cellNow.value = executiveName;
                    break;
                case 'name':
                    cellNow.value = i.member.name;
                    break;
                case 'phoneNumber':
                    cellNow.value = i.member.phoneNumber;
                    break;
                case 'rolls':
                    cellNow.value = rollDisplayNames[i.rollType];
                    break;
                case 'studentId':
                    cellNow.value = i.member.studentId;
                    break;
                case 'schoolRegistration':
                    cellNow.value = schoolRegistrationDisplayNames[i.schoolRegistration];
                    break;
                default:
                    continue;
            }
            colNow++;
        }
        if (firstRow) firstRow = false;
        rowNow++;
    }
    await workbook.xlsx.write(stream);
}

router.get('/', restrictByPermission('roll.list'), async (ctx: Context) => {
    let { schoolRegistration, query, rolls, limit, page, query_type } = ctx.request.query;
    const { saveAs } = ctx.request.query;
    const findOptions: FindOptions = { where: {} };
    const where: WhereOptions = {};

    // default value
    if (limit) limit = Number(limit);
    else limit = 15;
    if (page) page = Number(page);
    else page = 1;

    // always as array of string
    if (typeof schoolRegistration === 'string') schoolRegistration = [schoolRegistration];
    if (typeof rolls === 'string') rolls = [rolls];

    if (schoolRegistration) where.schoolRegistration = { [Op.or]: schoolRegistration };
    else schoolRegistration = [];
    if (rolls) where.rollType = { [Op.or]: rolls };
    else rolls = [];
    if (query_type === 'userId' && typeof query === 'string' && query.trim().length != 0) {
        const memberIds = (await User.findAll({
            where: { id: { [Op.like]: '%' + query + '%' } }
        })).map(i => i.memberId);
        const include: IncludeOptions = {
            model: Member,
            include: [
                {
                    model: User,
                    required: false
                }
            ],
            where: {
                memberId: {
                    [Op.or]: memberIds
                }
            }
        };
        findOptions.include = [include];
    } else if (typeof query === 'string' && query.trim().length != 0) {
        const includeWhere: WhereOptions = {};
        includeWhere[query_type] = { [Op.like]: '%' + query + '%' };
        findOptions.include = [
            {
                model: Member,
                include: [{ model: User, required: false }],
                where: includeWhere
            }
        ];
    } else {
        findOptions.include = [
            {
                model: Member,
                include: [{ model: User, required: false }]
            }
        ];
        query = '';
        query_type = null;
    }
    findOptions.where = where;
    if (saveAs === 'excel') {
        findOptions.include.push({ model: ExecutiveType, required: false });
        const result = await Roll.findAll(findOptions);

        ctx.set('Content-Disposition', 'attachment; filename="download.xlsx"');
        ctx.set(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        const tmpfile = tempy.file();
        const writableStream = fs.createWriteStream(tmpfile);
        await constructXlsx(
            result,
            { schoolRegistration, rolls, query, query_type },
            await ctx.user.$get('member'),
            new Date(),
            writableStream
        );
        writableStream.end();
        writableStream.close();
        ctx.body = fs.createReadStream(tmpfile);
    } else {
        const count = await Roll.count(findOptions);
        const pages = Math.ceil(count / limit),
            offset = (page - 1) * limit;
        findOptions.limit = limit;
        findOptions.offset = offset;
        const result = await Roll.findAll(findOptions);
        await ctx.render('admin/roll', {
            rollDisplayNames,
            schoolRegistrationDisplayNames,
            pages,
            page,
            limit,
            roll: result,
            searchInfo: { query, query_type, rolls, schoolRegistration }
        });
    }
});
router.get('/new', restrictByPermission('roll.create'), async (ctx: Context) => {
    await ctx.render('admin/roll_fields', { add_member: true });
});
router.post('/new', restrictByPermission('roll.create'), bodyParser(), async (ctx: Context) => {
    const {
        name,
        studentId,
        department,
        birthday,
        phoneNumber,
        roll: rollType,
        schoolRegistration
    } = ctx.request.body as memberFormFields & rollFormFields;

    if (studentId && (await Member.findOne({ where: { studentId } }))) {
        await ctx.render('admin/roll_fields', {
            add_member: true,
            error: '이미 존재하는 회원입니다.'
        });
    }

    const member = await Member.create({
        name,
        studentId,
        department,
        birthday: new Date(birthday),
        phoneNumber
    });
    const roll = await Roll.create({ rollType, schoolRegistration, memberId: member.memberId });
    if (roll) {
        await ctx.render('admin/roll_fields', { add_member: true, message: '추가 완료' });
    } else {
        await ctx.render('admin/roll_fields', { add_member: true, error: '추가 실패' });
    }
});
router.get(
    '/update/:memberId',
    restrictByPermission('roll.update'),
    async (ctx: Context & ParameterizedContext) => {
        const roll = await Roll.findByPk(ctx.params.memberId);
        if (!roll) await ctx.throw(403, '존재하지 않는 회원입니다.');
        const member = await roll.$get('member');
        await ctx.render('admin/roll_fields', { roll, member });
    }
);
router.post(
    '/update/:memberId',
    restrictByPermission('roll.update'),
    bodyParser(),
    async (ctx: Context & ParameterizedContext) => {
        const {
            name,
            studentId,
            department,
            birthday,
            phoneNumber,
            roll: rollType,
            schoolRegistration
        } = ctx.request.body as memberFormFields & rollFormFields;
        const roll = await Roll.findByPk(ctx.params.memberId);
        if (!roll) await ctx.throw(403, '존재하지 않는 회원입니다.');
        const member = await roll.$get('member');
        roll.rollType = rollType;
        roll.schoolRegistration = schoolRegistration;
        member.name = name;
        member.studentId = studentId;
        member.department = department;
        member.birthday = new Date(birthday);
        member.phoneNumber = phoneNumber;

        await roll.save();
        await member.save();

        await ctx.render('admin/roll_fields', { roll, member, message: '수정 완료' });
    }
);

export default router;
