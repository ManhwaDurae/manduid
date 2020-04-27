import path from 'path'
import SMTPTransport from "nodemailer/lib/smtp-transport";

interface ConfigFile {
    databaseUri: string;
    httpPort: number;
    sessionSecret: string[];
    smtp: SMTPTransport.Options;
    oidcSecretKeys: string[];
}

let config : ConfigFile = require(path.join(process.cwd(), 'config.json'));
export default config;