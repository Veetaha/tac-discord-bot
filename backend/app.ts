import ds from 'discord.js';
import '@app/polyfills';
import 'moment-duration-format'; // moment plugin
import { Container } from 'typedi';

import { ConfigService } from '@modules/config/config.service';

async function main() {
    // set ds client instance before importing any other dependent services
    Container.set(ds.Client, new ds.Client);

    // set `DsLoggingService` implementation of instead `LoggingService` in production
    if (Container.get(ConfigService).isDevelopmentMode) {
        const [{LoggingService}, {DsLoggingService}] = await Promise.all([
            import('@modules/logging/logging.service'),
            import('@modules/logging/ds-logging.service')
        ]);
        Container.set(LoggingService, Container.get(DsLoggingService));
    }

    const [{AppService}, {GuildMemberAddHandlingService}] = await Promise.all([
        import('@modules/app.service'),
        import('@modules/handlers/guild-member-add-handling.service'),

        // Import all command handling services in order 
        // to registrer them in dependency injection system
        import('@modules/handlers')
    ]);
    await Container.get(AppService).init().run();
    
    // initialize event handlers
    Container.get(GuildMemberAddHandlingService);
}

main().catch(err => {
    console.log('Bootstrapping error');
    console.error(err);
});

                                                                            