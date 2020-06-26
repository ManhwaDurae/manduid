import Koa from 'koa';
import mount from 'koa-mount';
import Provider from 'oidc-provider';
import { User } from '~/models/User';
import { UserProfile } from '~/models/UserProfile';
import config from '~/config';
import adapter from './adapter';
import oidcRouter from './router';
import { JSONWebKeySet } from 'jose';
import md5 from 'md5';
import { Roll } from '~/models/Roll';
import { ExecutivePermission } from '~/models/ExecutivePermission';

export default function mountProvider(
    app: Koa,
    options: { jwks: JSONWebKeySet; url: string }
): void {
    const provider = new Provider(options.url, {
        adapter,
        jwks: options.jwks,
        findAccount: async (ctx, id) => {
            const user = await User.findByPk(id);
            if (user)
                return {
                    accountId: id,
                    async claims() {
                        const [profile, profileCreated] = await UserProfile.findOrCreate({where: {id: user.id}}),
                            name = (await user.$get('member')).name,
                            roll = await Roll.findByPk(user.memberId);
                        if (profileCreated) {
                            profile.id = user.id;
                            await profile.save();
                        }
                        let permission: Permission[] = [];
                        if (roll.isExecutive) {
                            permission = (await ExecutivePermission.findAll({
                                where: { executiveTypeId: roll.executiveTypeId }
                            }))
                                .map(i => i.permission)
                                .filter(i => i.startsWith('bbs') || i.startsWith('wiki'));
                        } else if (roll.isPresident) {
                            permission = ['root'];
                        }
                        return {
                            sub: id,
                            name,
                            email: user.emailAddress,
                            email_verified: true,
                            picture:
                                'https://id.caumd.club/avatar/' +
                                md5(user.emailAddress.trim().toLowerCase()),
                            nickname: profile.nickname || id,
                            website: profile.website || '',
                            bio: profile.introduction || '',
                            permission
                        };
                    }
                };
            else return undefined;
        },
        features: {
            devInteractions: {
                enabled: false
            },
            sessionManagement: {
                enabled: true
            },
            revocation: {
                enabled: true
            },
            backchannelLogout: {
                enabled: true
            }
        },
        claims: {
            openid: ['sub'],
            profile: ['name', 'nickname', 'profile', 'picture', 'website', 'bio'],
            email: ['email', 'email_verified'],
            permission: ['permission']
        },
        interactions: {
            url(ctx): string {
                return `/oidc/interaction/${ctx.oidc.uid}`;
            }
        },
        routes: {
            authorization: '/oidc/auth',
            check_session: '/oidc/session/check',
            code_verification: '/oidc/device',
            device_authorization: '/oidc/device/auth',
            end_session: '/oidc/session/end',
            introspection: '/oidc/token/introspection',
            jwks: '/oidc/jwks',
            pushed_authorization_request: '/oidc/request',
            registration: '/oidc/reg',
            revocation: '/oidc/token/revocation',
            token: '/oidc/token',
            userinfo: '/oidc/me'
        },
        renderError: async (ctx, out, error): Promise<void> => {
            for (const [key, value] of Object.entries(out))
                console.error(`OIDC Error ${key} : ${value}`);
            throw error;
        },
        cookies: {
            keys: config.oidcSecretKeys,
            long: { signed: true },
            short: { signed: true },
            names: {
                interaction: 'md_oidc_apple',
                resume: 'md_oidc_banana',
                session: 'md_oidc_cherry',
                state: 'md_oidc_durian'
            }
        },
        logoutSource: async (ctx, form): Promise<void> => {
            await ctx.render('sso_logout', { form });
        },
        postLogoutSuccessSource: async (ctx): Promise<void> => {
            await ctx.render('sso_logout', { success: true });
        }
    });
    provider.on('end_session.success', async ctx => {
        ctx.session = null;
        await ctx.oidc.session.destroy();
    });

    app.proxy = true;
    provider.proxy = true;

    app.use(mount(provider.app));
    app.use(mount('/oidc', oidcRouter(provider).routes()));
}
