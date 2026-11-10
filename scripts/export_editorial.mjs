import {writeFile} from 'node:fs/promises';
import {content} from '../phosphene/content.js';
await writeFile(new URL('../portfolio/main/editorial_content.json',import.meta.url), JSON.stringify({defaultPersona:content.defaultPersona,personas:content.personas,switchHint:content.switchHint,achievements:content.achievements,certificates:content.certificates},null,2)+'\n');
