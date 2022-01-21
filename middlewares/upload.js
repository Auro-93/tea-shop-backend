import multer from "multer";
import path from "path";
import * as fs from "fs";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(path.dirname(__dirname), "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "__" + file.originalname);
  },
});

console.log(path.join(path.dirname(__dirname), "uploads"));

const fileFilter = function (req, file, cb) {
  let files = fs.readdirSync("./uploads");
  let imageNameLength = file.originalname.length;
  files.forEach((f) => {
    if (f.slice(-imageNameLength) == file.originalname) {
      fs.unlinkSync("./uploads/" + f);
    }
  });

  if (
    file.mimetype.includes("jpeg") ||
    file.mimetype.includes("png") ||
    file.mimetype.includes("jpg")
  ) {
    cb(null, true);
  } else {
    req.validationError = "Only JPEG and PNG files are allowed";
    return cb(null, false, req.validationError);
  }
};

export const upload = multer({ storage: storage, fileFilter: fileFilter });
