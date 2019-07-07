import { CmdParamsParsingError } from "./errors/cmd.errors";

const enum State {
    Initial,
    SkippingWhitespace, 
    
    ReadingUnescaped,
    EndReadingUnescaped,
    
    BeginReadingEscaped,
    ReadingEscaped,
    EndReadingEscaped,

    MetEscapeChar
}

export class CmdParamsParser {

    /**
     * Attemts to parse whitespace-delimited params with otional enclosing `quoteChar`'s
     * that get escaped with `escapeChar`.
     * 
     * Pre: `escapeChar.length === 1 && quoteChar.length === 1`.
     * 
     * @param paramChars  Iterable over parameter string (this may be the string itself or
     *                    an array of single characters of this string). 
     * @param escapeChar  Character that escapes `quoteChar` in `quoteChar` enclosed string.
     * @param quoteChar   Character that parameter must be enclosed with if it contains whitespace.
     */
    static parseParamsOrFail(paramChars: Iterable<string>, escapeChar: string, quoteChar: string) {
        return new CmdParamsParser(escapeChar, quoteChar)
            .parseParamsOrFailImpl(paramChars);
    }


    private constructor(
        private readonly escapeChar: string, 
        private readonly quoteChar: string,
    ) {}

    private *parseParamsOrFailImpl(paramChars: Iterable<string>) {
        let state = State.Initial;
        let currentParam = '';
        for (const char of paramChars) {
            switch(state = this.getNextStateOrFail(char, state)) {
                case State.ReadingUnescaped:
                case State.ReadingEscaped: {
                    currentParam += char; 
                    break;
                }
                case State.EndReadingEscaped:
                case State.EndReadingUnescaped: {
                    yield currentParam; 
                    currentParam = '';
                    break;
                }
            }
        }
        switch (state) {
            case State.ReadingUnescaped: {
                yield currentParam;
                break;
            }
            case State.BeginReadingEscaped:
            case State.ReadingEscaped:
            case State.MetEscapeChar: {
                throw new CmdParamsParsingError(
                    `Expected closing ${this.quoteChar}.`
                );
            }
        }
    }

    private getNextStateOrFail(char: string, state: State) {
        switch (state) {
            case State.Initial:
            case State.EndReadingUnescaped:
            case State.SkippingWhitespace: return (
                CmdParamsParser.isWhiteSpace(char)?  
                State.SkippingWhitespace          :
                char === this.quoteChar           ? 
                State.BeginReadingEscaped         :
                State.ReadingUnescaped
            );
            case State.ReadingUnescaped: return (
                CmdParamsParser.isWhiteSpace(char)?
                State.EndReadingUnescaped       :
                State.ReadingUnescaped
            );
            case State.BeginReadingEscaped:
            case State.ReadingEscaped: return (
                char === this.quoteChar  ?
                State.EndReadingEscaped  :
                char === this.escapeChar ? 
                State.MetEscapeChar      :
                State.ReadingEscaped
            );
            case State.MetEscapeChar: return State.ReadingEscaped; 
            case State.EndReadingEscaped: {
                if (!CmdParamsParser.isWhiteSpace(char)) {
                    throw new CmdParamsParsingError(
                        `Expected whitespace after closing ${this.quoteChar}.`
                    );
                }
                return State.SkippingWhitespace;
            }
        }
    }

    private static isWhiteSpace(char: string) {
        return '\r\n\t\f\v '.includes(char);
    }

}