import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const MAX = (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

const IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
const AUDIO  = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];

const storage = (sub) => multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_ROOT, sub)),
  filename: (_req, file, cb) => {
    const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${id}${path.extname(file.originalname)}`);
  },
});

const filter = (types) => (_req, file, cb) =>
  types.includes(file.mimetype)
    ? cb(null, true)
    : cb(new AppError(`Invalid file type. Allowed: ${types.join(', ')}`, 400));

export const uploadImage = multer({ storage: storage('images'), limits: { fileSize: MAX }, fileFilter: filter(IMAGES) });
export const uploadAudio = multer({ storage: storage('audio'),  limits: { fileSize: MAX }, fileFilter: filter(AUDIO) });
