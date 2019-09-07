import Ds from 'discord.js';
import Gm from 'gm';
const Im = Gm.subClass({ imageMagick: true });

import { Service } from "typedi";

import { AppService     } from "@modules/app.service";
import { DebugService   } from "@modules/debug.service";
import { LoggingService } from '@modules/logging/logging.service';
import { ConfigService  } from '@modules/config/config.service';
import { GifId          } from '@modules/asset.service';
import { CanvasService  } from '@modules/canvas.service';


@Service()
export class GuildMemberAddHandlingService {
    private readonly initialMemberRoles!: Ds.Role[];

    constructor(
        private readonly config:      ConfigService,
        private readonly app:         AppService, 
        private readonly debug:       DebugService,
        private readonly log:         LoggingService,
        private readonly canvasUtils: CanvasService,
        dsClient: Ds.Client,
    ) {
        const mainGuild = this.app.getMainGuild();
        this.initialMemberRoles = this.config.mainGuild.initialMemberRoles.map(
            roleName => mainGuild.roles.find(role => role.name === roleName)
        );
        dsClient.on('guildMemberAdd', newMember => Promise.all([
            this.setNewMemberInitialRoles(newMember).catch(this.log.createErrback(
                `Failed to set new member initial roles`
            )),
            this.sendWelcomePicToNewMember(newMember).catch(this.log.createErrback(
                `Failed to send welcome picture to new member`
            ))
        ]));

        this.debug.assert(() => mainGuild.me.hasPermission('MANAGE_ROLES'));
        this.debug.assert(() => !this.initialMemberRoles.includes(null!));
    }

    private async setNewMemberInitialRoles(newMember: Ds.GuildMember) {
        return newMember.addRoles(
            this.initialMemberRoles.filter(role => !newMember.roles.has(role.id)), 
            `All new members get ${this.initialMemberRoles.length === 1 ? 
                'this role' : 'these roles'
            }.`
        );
    }

    private async sendWelcomePicToNewMember(newMember: Ds.GuildMember) {
        const {cmdPrefix} = this.config.cmdHandlingParams;
        const img = await this.createWelcomeMemberImgStream(newMember);
        return this.app.getMainTextChannel().send(new Ds.RichEmbed({
            title: `Welcome to the server, **${newMember.displayName}**!`,
            description: 
                `Send ${'`'}${cmdPrefix}help${'`'} in order to get available commands refference.`, 
            image: { url: 'attachment://welcome-img.gif'},
            file: new Ds.Attachment(img, 'welcome-img.gif'),
            color: 15400704
        }));
    }

    private async createWelcomeMemberImgStream(newMember: Ds.GuildMember) {
        const welcomeText = `Hi, ${newMember.displayName}!`;
        const fontFace = 'Consolas';
        const fontSize = this.canvasUtils.getFontSizeToFit(welcomeText, fontFace, 900);
        
        return Im(GifId.MemberWelcomeBg)
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
