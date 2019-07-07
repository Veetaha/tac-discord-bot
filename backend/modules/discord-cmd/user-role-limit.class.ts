import Ds from 'discord.js';
import Container from 'typedi';
import { Nullable } from 'ts-typedefs';

import { IteratorService } from '@modules/utils/iterator.service';

export class UserRoleLimit {
    private static readonly iter = Container.get(IteratorService);

    /** Creates `DiscordUserRoleLimit` that denies access only for the given roles. */
    static deny(...roles: string[]) {
        return new UserRoleLimit(new Set(roles), false);
    }

    /** Creates `DiscordUserRoleLimit` that allows access only for the given roles. */
    static allow(...roles: string[]) {
        return new UserRoleLimit(new Set(roles), true);
    }

    constructor(
        readonly roles:      Set<string>,
        readonly areAllowed: boolean
    ) {}

    /** 
     * Returns the object that defines whether `suspectRoles` passed the role
     * limit check and which role determined the result of the check if there was one.
     * 
     * @param suspectRoles Discord user roles to check.
     */
    matchToRoleLimit(suspectRoles: Ds.GuildMember['roles']) {
        const determinativeRole: Nullable<Ds.Role> = suspectRoles
            .find(role => this.roles.has(role.name));
            
        return {
            matches: this.areAllowed === !!determinativeRole,
            determinativeRole
        };
    }

    /** 
     * Joins the set of roles of this limit into a single string. 
     * 
     * @param separator Separator string that will be inserted between role names.
     */
    stringifyRoles(separator = ', ') {
        return UserRoleLimit.iter.join(this.roles.values(), separator);
    }
}