import Canvas from 'canvas';
import Ds from 'discord.js';
import { Service } from "typedi";

import { DsClientService     } from "@modules/ds-client.service";
import { DebugService        } from "@modules/debug.service";
import { LoggingService      } from '@modules/logging.service';
import { ConfigService       } from '@modules/config.service';
import { AssetService, ImgId } from '@modules/asset.service';
import { CanvasService       } from '@modules/canvas.service';


@Service()
export class GuildMemberAddHandlingService {
    private initialMemberRoles!: Ds.Role[];

    constructor(
        private readonly canvasUtils: CanvasService,
        private readonly assets:   AssetService,
        private readonly config:   ConfigService,
        private readonly dsClient: DsClientService, 
        private readonly debug:    DebugService,
        private readonly log:      LoggingService
    ) {}

    init() {
        const mainGuild = this.dsClient.getMainGuild();
        this.initialMemberRoles = this.config.mainGuild.initialMemberRoles.map(
            roleName => mainGuild.roles.find(role => role.name === roleName)
        );
        this.dsClient.client.on('guildMemberAdd', newMember => Promise.all([
            this.setNewMemberInitialRoles(newMember),
            this.sendWelcomePicToNewMember(newMember)
        ]).catch(err => this.log.error(err, `Failed to procces new member`)));

        this.debug.assert(() => mainGuild.me.hasPermission('MANAGE_ROLES'));
        this.debug.assert(() => this.initialMemberRoles.findIndex(r => r == null) < 0);
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
        const imgBuf = (await this.createWelcomeMemberCanvas(newMember)).toBuffer();
        return this.dsClient.getMainTextChannel().send(new Ds.RichEmbed({
            title: `Welcome to the server, **${newMember.displayName}**!`,
            description: 
                `Send ${'`'}${cmdPrefix}help${'`'} in order to get available commands refference.`, 
            image: { url: 'attachment://welcome-img.png'},
            file: new Ds.Attachment(imgBuf, 'welcome-img.png'),
            color: 15400704
        }));
    }
    readonly welcomeImg = {
        userAva: {
            x: 20, 
            y: 850, 
            radius: 200
        },
        bg: {
            width: 1700,
            height: 900
        }
    } as const;
    private async createWelcomeMemberCanvas(newMember: Ds.GuildMember) {
        const { bg, userAva } = this.welcomeImg;
        const [userAvaImg, bgImg] = await Promise.all([
            Canvas.loadImage(newMember.user.displayAvatarURL),
            this.assets.getImage(ImgId.MemberWelcomeBg),
        ]);
        const canvas = Canvas.createCanvas(bg.width, bg.height + 500);
        const ctx    = canvas.getContext('2d');
        ctx.drawImage(bgImg, 0, 0);
        ctx.save();
        ctx.beginPath();
            ctx.arc(
                userAva.x + userAva.radius, 
                userAva.y + userAva.radius, 
                userAva.radius,
                0, 
                2 * Math.PI, 
                true
            );
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(userAvaImg, userAva.x, userAva.y, 2 * userAva.radius, 2 * userAva.radius); 
        ctx.restore();
        
        const welcomeText = `Hi, ${newMember.displayName}!`;
        const welcomeTextLeftMargin = 2 * (userAva.radius + userAva.x);
        const fontFace = 'Impact';
        const fontSize = this.canvasUtils.getFontSizeToFit(
            welcomeText, fontFace, canvas.width - welcomeTextLeftMargin
        );
        ctx.font = `${fontSize}px ${fontFace}`;
        ctx.fillStyle = '#6395ea';
        ctx.fillText(
            welcomeText, 
            welcomeTextLeftMargin, 
            canvas.height * 0.8 // if 1 text may overflow over the bottom if the image
        ); 
        return canvas;
    }

    
    

}