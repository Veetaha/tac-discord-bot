import '@app/polyfills';
import Container from 'typedi';

import { DsClientService } from '@modules/ds-client.service';

// Import all command handling services in order 
// to registrer them in dependency injection system
import '@modules/handlers';
import { LoggingService } from '@modules/logging.service';
import { GuildMemberAddHandlingService } from '@modules/handlers/guild-member-add-handling.service';

const log = Container.get(LoggingService);
const guildMemberAddHandling = Container.get(GuildMemberAddHandlingService);

Container.get(DsClientService).init().run().then(
    () => guildMemberAddHandling.init(),  
    err => log.error(err, `bootstrapping error, discord bot failed to log in`)
);