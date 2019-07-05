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
        

        await newMember.addRoles(
            this.initialMemberRoles.filter(role => !newMember.roles.has(role.id)), 
            `All new members get ${this.initialMemberRoles.length === 1 ? 
                'this role' : 'these roles'
            }.`
        );
    }

    private async sendWelcomePicToNewMember(newMember: Ds.GuildMember) {
        const canvas = await this.createWelcomeMemberCanvas(newMember);
        return this.dsClient.getMainTextChannel().send(
            `Welcome to the server, **${newMember.displayName}**!`, 
            new Ds.Attachment(canvas.toBuffer(), 'welcome-img.png')
        );
    }

    private async createWelcomeMemberCanvas(newMember: Ds.GuildMember) {
        const { bg, userAva } = this.config.welcomeImg;
        const [userAvaImg, bgImg] = await Promise.all([
            Canvas.loadImage(newMember.user.displayAvatarURL),
            this.assets.getImage(ImgId.MemberWelcomeBg),
        ]);
        const canvas = Canvas.createCanvas(bg.width, bg.height);
        const ctx    = canvas.getContext('2d');
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
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
        
        const welcomeText = `Welcome ${newMember.displayName}!`;
        const fontFace = 'monospace';
        const fontSize = this.canvasUtils.getFontSizeToFit(welcomeText, fontFace, canvas.width);
        ctx.font = `${fontSize}px ${fontFace}`;
        ctx.fillStyle = '#f0fc00';
        ctx.fillText(welcomeText, 0, canvas.height);

        return canvas;
    }

    
    

}