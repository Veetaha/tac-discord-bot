import { FreezeGuard } from "@modules/utils/freeze-guard.decorator";

/** Defines the threshold time for promises to resolve, otherwise program crashes */
export const AppFreezeGuard = FreezeGuard(30_000);