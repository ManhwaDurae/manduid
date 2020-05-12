import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import { UserProfile } from '~/models/UserProfile';
import storage from './avatarStorage';
import bodyParser from 'koa-bodyparser';
import parseDataUrl from 'data-urls';

const router = new Router<DefaultState, Context>();
const renderProfile = async (
    ctx: Context,
    profile: UserProfile,
    message: string = null
): Promise<void> => {
    await ctx.render('profile', {
        profile,
        message,
        avatarUrl: await profile.avatarUrl(),
        avatarFallbackUrl: await profile.avatarFallbackUrl(),
        hasCustomAvatar: await storage.has(await profile.avatarUid())
    });
};
router.get('/', async (ctx: Context) => {
    const [profile, profileCreated] = await UserProfile.findOrCreate({
        where: { id: ctx.user.id }
    });
    if (profileCreated) profile.id = ctx.user.id;
    await profile.save();
    await renderProfile(ctx, profile);
});
router.post('/', bodyParser({ formLimit: '700mb' }), async (ctx: Context) => {
    const [profile, profileCreated] = await UserProfile.findOrCreate({
        where: { id: ctx.user.id }
    });
    if (profileCreated) profile.id = ctx.user.id;

    const { avatar: avatarDataUrl, avatarMode, nickname, website, introduction } = ctx.request
        .body as {
        avatar: string;
        avatarMode: 'doNothing' | 'upload' | 'remove';
        nickname: string;
        website: string;
        introduction: string;
    };

    profile.nickname = nickname;
    profile.website = website;
    profile.introduction = introduction;

    const profileUid = await profile.avatarUid();
    switch (avatarMode) {
        case 'upload': {
            const avatar = parseDataUrl(avatarDataUrl);
            await storage.upload(profileUid, avatar.mimeType, avatar.body);
            break;
        }
        case 'remove':
            if (await storage.has(profileUid)) await storage.remove(profileUid);
            break;
    }

    await profile.save();
    await renderProfile(ctx, profile, '수정됐습니다.');
});

export default router;
