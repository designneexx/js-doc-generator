import { FormatCodeSettings, ts } from 'ts-morph';

/**
 * Настройки форматирования кода.
 */
export const formatCodeSettings: FormatCodeSettings = {
    ensureNewLineAtEndOfFile: false,
    baseIndentSize: 0,
    indentSize: 0,
    convertTabsToSpaces: false,
    newLineCharacter: '',
    indentStyle: ts.IndentStyle.None,
    trimTrailingWhitespace: true,
    insertSpaceAfterCommaDelimiter: false,
    insertSpaceAfterSemicolonInForStatements: false,
    insertSpaceBeforeAndAfterBinaryOperators: false,
    insertSpaceAfterConstructor: false,
    insertSpaceAfterKeywordsInControlFlowStatements: false,
    insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
    insertSpaceAfterTypeAssertion: false,
    insertSpaceBeforeFunctionParenthesis: false,
    placeOpenBraceOnNewLineForFunctions: false,
    placeOpenBraceOnNewLineForControlBlocks: false,
    insertSpaceBeforeTypeAnnotation: false,
    indentMultiLineObjectLiteralBeginningOnBlankLine: false,
    semicolons: ts.SemicolonPreference.Insert,
    indentSwitchCase: false
};
