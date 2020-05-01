import nodemailer from 'nodemailer';
import config from './config';

const transport = nodemailer.createTransport(config.smtp);
export default transport;
