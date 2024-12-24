import 'dotenv/config';
import { createJSDocGeneratorService } from '@auto-js-doc-generator/client';

const jsDocGeneratorService = createJSDocGeneratorService();

export default {
    files: ['packages/**/*.{ts,tsx}'],
    jsDocGeneratorService,
    projectOptions: {
        tsConfigFilePath: 'tsconfig.json'
    },
    globalGenerationOptions: {
        jsDocOptions: {
            mode: 1
        }
    }
};
