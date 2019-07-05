import Container from 'typedi';
import { GuildMemberAddHandlingService } from './guild-member-add-handling.service';

export * from './cmd';

void Container.get(GuildMemberAddHandlingService); // trigger service construction