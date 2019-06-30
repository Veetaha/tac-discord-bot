import '@app/polyfills';
import Container from 'typedi';

import { DsClientService } from '@modules/ds-client.service';

// Import all command handling services in order 
// to registrer them in dependency injection system
import '@modules/cmd-handlers';

Container.get(DsClientService).init().run();
