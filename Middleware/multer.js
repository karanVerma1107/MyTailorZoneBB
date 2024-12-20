import path from 'path';
import multer from 'multer';

// Define storage configuration for multer
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, "./uploads");
    },
    filename: function(req,file,cb){
        cb(null,Date.now() + path.extname( file.originalname));
    }
});

export const upload = multer({storage: storage});