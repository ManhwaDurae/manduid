import Provider from 'oidc-provider'
import Koa from 'koa'
import { User } from '../../models/User';
import adapter from './adapter';
import oidcRouter from './router';
import mount from 'koa-mount';
import config from '../../config';

export default function mountProvider(app: Koa, options: {'jwks': any, 'url': string}) {
    const provider = new Provider(options.url, {
        adapter,
        jwks: options.jwks,
        findAccount: async (ctx, id) => {
            let user = await User.findByPk(id);
            if (user)
                return {
                    accountId: id,
                    async claims() {
                        return {
                            sub: id,
                            email: user.emailAddress
                        };
                    }
                }
            else
                return undefined;
        },
        features: {
            devInteractions: {
                enabled: false
            },
            sessionManagement : {
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
            permission: ['permission']
        },
        interactions: {
            url(ctx) {
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
          renderError: async (ctx, out, error) => {
            for(let [key, value] of Object.entries(out))
                console.error(`OIDC Error ${key} : ${value}`);
            throw error;
          },
          cookies: {
              keys: config.oidcSecretKeys,
              long: {signed: true},
              short: {signed: true},
              names: {
                  interaction: 'md_oidc_apple',
                  resume: 'md_oidc_banana',
                  session: 'md_oidc_cherry',
                  state: 'md_oidc_durian'
              }
          }
    });

    app.use(mount(provider.app));
    app.use(mount('/oidc', oidcRouter(provider).routes()));
}