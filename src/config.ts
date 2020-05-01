import path from 'path'
import SMTPTransport from "nodemailer/lib/smtp-transport";

interface ConfigFile {
    databaseUri: string;
    httpPort: number;
    sessionSecret: string[];
    smtp: SMTPTransport.Options;
    oidcSecretKeys: string[];
    xlsxTemplate: {
        path: string,
        sheetName: string,
        searchInfo : {
            searcher: string,
            searchDate: string,
            resultCount: string
        },
        searchConditions: {
            schoolRegistrations: string,
            rolls: string,
            query_type: string,
            query: string
        },
        result: {
            start: string,
            order: ("rolls" | "name" | "department" | "studentId" | "birthday" | "phoneNumber" | "executiveName" | "accountId")[]
        }
    };
}

let config : ConfigFile = require(path.join(process.cwd(), 'config.json'));
export default config;