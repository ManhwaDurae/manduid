import Router from '@koa/router';
import { Next, Context, DefaultState, ParameterizedContext } from 'koa';
import { User } from '../../models/User';
import { ExecutiveType } from '../../models/ExecutiveType';
import { ExecutivePermission } from '../../models/ExecutivePermission';
import { Roll } from '../../models/Roll';
import fs from 'fs'
import bodyParser from 'koa-bodyparser';
import { Member } from '../../models/Member';
import { FindOptions, WhereOptions, Op, IncludeOptions } from 'sequelize';
import { restrictByPermission } from './middleware';
import ExcelJs from 'exceljs';
import tempy from 'tempy'
import config from '../../config'
import { Stream } from 'stream';

let router = new Router<DefaultState, Context & ParameterizedContext>();

const rollDisplayNames : {[index in RollType] : string} = {'AssociateMember' : '준회원', 'RegularMember' : '정회원', 'HonoraryMember' : '명예회원', 'Explusion' : '제적', 'PermanentExplusion' : '제명'}
const schoolRegistrationDisplayNames : {[index in SchoolRegistration] : string} = {'Enrolled' : '재학', 'LeaveOfAbsence' : '휴학', 'Graduated' : '졸업', 'Expelled' : '제적'}

function excelColNameToNumber(colName : string) : number {
    colName = colName.toUpperCase();

    let sum : number = 0;

    for (let i = 0; i < colName.length; i++) {
        sum *= 26;
        sum += colName[i].charCodeAt(i) - 'A'.charCodeAt(0) + 1;
    }

    return sum;
}

async function constructXlsx(result: Roll[], searchConditions: {schoolRegistration: SchoolRegistration[], rolls: RollType[], query_type: string, query: string}, searcher: Member, searchDate: Date, stream: Stream) {
    let workbook = new ExcelJs.Workbook();
    await workbook.xlsx.readFile(config.xlsxTemplate.path);
    let worksheet = workbook.getWorksheet(config.xlsxTemplate.sheetName);

    // Insert search info
    worksheet.getCell(config.xlsxTemplate.searchInfo.searcher).value = searcher.name;
    worksheet.getCell(config.xlsxTemplate.searchInfo.searcher).value = searcher.name;
    worksheet.getCell(config.xlsxTemplate.searchInfo.searchDate).value = searchDate;
    worksheet.getCell(config.xlsxTemplate.searchInfo.resultCount).value = result.length;
    
    // Insert search conditions
    let queryTypeDescriptions : {[index : string]: string;} = {'name' : '이름', 'studentId': '학번', 'phoneNumber' : '전화번호', 'department' : '학과', 'userId' : '계정 아이디'}
    worksheet.getCell(config.xlsxTemplate.searchConditions.query_type).value = queryTypeDescriptions[searchConditions.query_type] || '';
    worksheet.getCell(config.xlsxTemplate.searchConditions.query).value = searchConditions.query || '';
    worksheet.getCell(config.xlsxTemplate.searchConditions.rolls).value = searchConditions.rolls.length == 0 ? "전체" : searchConditions.rolls.map(i => rollDisplayNames[i]).join(", ");
    worksheet.getCell(config.xlsxTemplate.searchConditions.schoolRegistrations).value = searchConditions.schoolRegistration.length == 0 ? "전체" : searchConditions.schoolRegistration.map(i => schoolRegistrationDisplayNames[i]).join(", ");

    // Insert result
    let rowNow = Number(/[a-zA-Z]+([0-9]+)/.exec(config.xlsxTemplate.result.start)[1]);
    const startCol = excelColNameToNumber(/([a-zA-Z]+)/.exec(config.xlsxTemplate.result.start)[1]);
    let firstRow = true;
    for (let i of result) {
        let user = await i.member.$get('user');
        let executiveName = '';
        if(i.executiveType) executiveName = i.executiveType.name;
        else if (i.isPresident) executiveName = '회장';

        let colNow = startCol;
        for (let j of config.xlsxTemplate.result.order) {
            let cellNow = worksheet.getCell(rowNow, colNow);
            if(!firstRow) {
                let styleTemplateCell = worksheet.getCell(rowNow - 1, colNow);
                cellNow.style = styleTemplateCell.style;
            }
            switch (j) {
                case "accountId":
                    if (user)
                        cellNow.value = user.id
                break;
                case "birthday":
                    cellNow.value = i.member.birthday;
                break;
                case "department":
                    cellNow.value = i.member.department;
                break;
                case "executiveName":
                    cellNow.value = executiveName;
                break;
                case "name":
                    cellNow.value = i.member.name;
                break;
                case "phoneNumber":
                    cellNow.value = i.member.phoneNumber
                break;
                case "rolls":
                    cellNow.value = rollDisplayNames[i.rollType]
                break;
                case "studentId":
                    cellNow.value = i.member.studentId
                break;
                default:
                    continue;
            }
            colNow++;
        }
        if (firstRow)
            firstRow = false;
        rowNow++;
    }
    await workbook.xlsx.write(stream);
}

router.get('/', restrictByPermission('roll.list'), async (ctx: Context) => { 

    let {schoolRegistration, query, query_type, rolls, limit, page, saveAs} = ctx.request.query;
    let findOptions : FindOptions = {where: {}};
    let where : WhereOptions = {};

    // default value
    if (limit)
        limit = Number(limit)
    else
        limit = 15;
    if (page)
        page = Number(page)
    else
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
    if (saveAs === "excel") {
        findOptions.include.push({model: ExecutiveType, required: false});
        let result = await Roll.findAll(findOptions);

        ctx.set('Content-Disposition', 'attachment; filename="download.xlsx"');
        ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        let tmpfile = tempy.file();
        let writableStream = fs.createWriteStream(tmpfile);
        await constructXlsx(result, {schoolRegistration,rolls,query,query_type},await ctx.user.$get('member'), new Date(), writableStream);
        writableStream.end();
        writableStream.close();
        ctx.body = fs.createReadStream(tmpfile)
    } else {
        let count = await Roll.count(findOptions);
        let pages = Math.ceil(count / limit),
            offset = (page - 1) * limit;
        findOptions.limit = limit;
        findOptions.offset = offset;
        let result = await Roll.findAll(findOptions);
        await ctx.render('admin/roll', {rollDisplayNames, schoolRegistrationDisplayNames, pages, page, limit, roll: result, searchInfo : {query, query_type, rolls, schoolRegistration}});
    }
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