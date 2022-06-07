// const path = require("path");
// const multer = require("multer");
// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + file.originalname;
//     cb(null, file.fieldname + "-" + uniqueSuffix);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/jpeg"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// module.exports = fileFilter;

const multer = require("multer");
const path = require("path");
// upload file on local Storage
const imageStorage = multer.diskStorage({
  destination: `uploads`, // Destination to store images
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10000000, // 10000000 Bytes = 10 MB
  },
  fileFilter(req, file, cb) {
    // upload only mp4 and mkv format
    if (!file.originalname.match(/\.(jpeg|png|svg|jpg|gif)$/)) {
      return cb(new Error("Please upload Image"));
    }
    cb(undefined, true);
  },
}).single("image");

module.exports = imageUpload;
