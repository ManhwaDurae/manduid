import { User } from '~/models/User';

declare module 'koa' {
    interface Context {
        user: User;
    }
}
