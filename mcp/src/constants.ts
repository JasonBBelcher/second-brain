import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Resolve the second-brain root (one level up from mcp/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const KB_ROOT = resolve(__dirname, '..', '..');

export const SERVER_NAME = 'second-brain-mcp';
export const SERVER_VERSION = '1.0.0';

// Directories within KB_ROOT that contain markdown docs
export const KB_DIRS = ['projects', 'preferences'];

// URI scheme used for resources
export const URI_SCHEME = 'brain';
