import ds from 'discord.js';
import gm from 'gm';
import _ from 'lodash';
const im = gm.subClass({ imageMagick: true });

import { Service } from "typedi";

import { AppService     } from "@modules/app.service";
import { DebugService   } from "@modules/debug.service";
import { LoggingService } from '@modules/logging/logging.service';
import { ConfigService  } from '@modules/config/config.service';
import { GifId          } from '@modules/asset.service';
import { CanvasService  } from '@modules/canvas.service';


@Service()
export class GuildMemberAddHandlingService {
    constructor(
        private readonly config:      ConfigService,
        private readonly app:         AppService,
        private readonly debug:       DebugService,
        private readonly log:         LoggingService,
        private readonly canvasUtils: CanvasService,
        dsClient: ds.Client,
    ) {
        dsClient.on('guildMemberAdd', newMember => Promise.all([
            this.setNewMemberInitialRoles(newMember).catch(this.log.createErrback(
                `Failed to set new member initial roles`
            )),
            this.sendWelcomePicToNewMember(newMember).catch(this.log.createErrback(
                `Failed to send welcome picture to new member`
            ))
        ]));
    }

    private readonly initialMemberRoles = _.memoize((): Map<string, ds.Role[]> => {
        const roles = new Map<string, ds.Role[]>();

        this.app.getMainGuilds().forEach(([guild, _, guildConfig]) => {
            const initialRoles = guildConfig.initialMemberRoles.map(
                initialRole => {
                    const role = guild.roles.cache.find(role => role.name == initialRole);
                    if (!role) {
                        throw new Error(
                            `Initial role specified in config doesn't exist ` +
                            `guild: ${guild.name}, role: ${initialRole}`
                        );
                    }
                    return role;
                }
            );
            roles.set(guild.name, initialRoles);
            this.debug.assert(() => guild.me!.hasPermission('MANAGE_ROLES'));
        });
        return roles;
    });

    private async setNewMemberInitialRoles(newMember: ds.GuildMember | ds.PartialGuildMember) {
        const initialMemberRoles = this.initialMemberRoles();


        const initialRoles = initialMemberRoles.get(newMember.guild.name);
        if (!initialRoles) {
            return this.log.error(
                `Member ${newMember.displayName} from unknown guild was added: ${newMember.guild.name} ` +
                `Known guilds: ${[...this.app.getMainGuilds().values()].map(it => it[0].name)}`
            );
        }

        const newRoles = initialRoles.filter(role => !newMember.roles.cache.has(role.id));

        if (newRoles.length === 0) return;
        this.log.info(newRoles, `Added new roles to new member "${newMember.displayName}"`);

        return newMember.roles.add(
            newRoles,
            `All new members get ${newRoles.length === 1 ? 'this role' : 'these roles'}.`
        );
    }

    private async sendWelcomePicToNewMember(newMember: ds.GuildMember | ds.PartialGuildMember) {
        const {cmdPrefix} = this.config.cmdHandlingParams;
        const img = await this.createWelcomeMemberImgStream(newMember);

        return this.app.getMainTextChannel(newMember.guild.name).send(new ds.MessageEmbed({
            title: `Welcome to the server, **${newMember.displayName}**!`,
            description:
                `Send ${'`'}${cmdPrefix}help${'`'} in order to get available commands refference.`,
            image: { url: 'attachment://welcome-img.gif'},
            files: [new ds.MessageAttachment(img, 'welcome-img.gif')],
            color: 15400704
        }));
    }

    private async createWelcomeMemberImgStream(newMember: ds.GuildMember | ds.PartialGuildMember) {
        const welcomeText = `Hi, ${newMember.displayName}!`;
        const fontFace = 'Consolas';
        const fontSize = this.canvasUtils.getFontSizeToFit(welcomeText, fontFace, 900);

        return im(GifId.MemberWelcomeBg)
            .coalesce()
            .quality(100)
            .stroke("#000")
            .strokeWidth(3)
            .fill("#6395ea")
            .font(`${fontFace}.ttf`, fontSize)
            .dither(false)
            .colors(128)
            .drawText(0, 0, welcomeText, 'South')
            .stream('gif');
    }
}
