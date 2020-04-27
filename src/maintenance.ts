import {
    Sequelize
} from 'sequelize-typescript'
import path from 'path'
import inquirer from 'inquirer';
import {
    ApplicationForm
} from './models/ApplicationForm';
import { Password } from './password';
import { User } from './models/User';
import config from './config'

(async () => {
        const sequelize = new Sequelize(config.databaseUri, {
            models: [__dirname + '/models']
        })

        await sequelize.sync();

        let result = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            choices: ['createApplicationForm', 'createUser', 'insertTestData']
        }]);
        switch (result.action) {
            case 'insertTestData':
                
                break;
            case 'createApplicationForm':
                let fields = await inquirer.prompt([{
                        type: 'input',
                        name: 'name',
                        message: 'Applicant name'
                    }, {
                        name: 'department',
                        type: 'input',
                        message: 'Department'
                    }, {
                        type: "number",
                        name: 'studentId',
                        message: 'Student id'
                    }, {
                        name: 'phoneNumber',
                        type: 'input',
                        message: 'Phone number'
                    }, {
                        name: 'emailAddress',
                        type: 'input',
                        message: 'Email address'
                    }, {
                        name: 'birthday',
                        type: 'input',
                        message: 'Birthday, Format : 2020-01-01 00:00:00+09:00',
                        filter: value => new Date(value)
                    }, {
                        name: 'applicationDate',
                        type: 'input',
                        message: 'Application date, Format : 2020-01-01 00:00:00+09:00',
                        filter: value => new Date(value)
                    }
                ]);
                let form = await ApplicationForm.create(fields);
                console.log(`created, application form id : ${form.applicationId}`);
        break;
        case 'createUser':
            let userFields = await inquirer.prompt([
                {
                    name: 'id',
                    type: 'input',
                    message: 'Id, used for login'
                }, {
                    name: 'password',
                    type: 'password',
                    message: 'Password'
                }, {
                    name: 'applicationId',
                    type: 'number',
                    message: 'Application id'
                }, {
                    name: 'hashAlgorithm',
                    type: 'list',
                    message: 'Password hash algorithm',
                    choices: ['bcrypt']
                }
            ]);
            let pw = new Password(userFields.password, false);
            userFields.password = await pw.getHash(userFields.hashAlgorithm);
            
            await User.create(userFields);
            console.log('Done');
    }
})();