import { NoopIf } from "@common/utils/noop-if.decorator";

import Container from "typedi";

import { ConfigService } from "./config.service";

/** Decorator that should be used on methods to disable in production mode */
export const NoopInProduction = NoopIf(!Container.get(ConfigService).isDevelopmentMode);