// Xử lý việc lưu file

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '-'
    let fileName = file.originalname.substring(0,file.originalname.lastIndexOf('.')) +  uniqueSuffix + path.extname(file.originalname)
    cb(null, fileName)
  }
});

// Set up multer middleware for handling file uploads
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log("reqUpload",req.body)
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return res.json({ result:"Failed",error: "Chỉ cho upload file ảnh!" })
    }
    else{
      console.log("file",file);
      cb(null, true);
    }
  }
});
const handleUpload = (req, res, next) => {
  return upload.array('files')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      // Handle multer specific errors
      console.error('Multer error:', error);
      return res.status(400).json({ result:"Failed", error: 'Error uploading files' });
    } else if (error) {
      // Handle other errors
      console.error('Error uploading files:', error);
      return res.status(500).json({result:"Failed", error: 'Internal server error' });
    }
    
    // No error, continue to the next middleware or controller

    next();
  });
}
const handleUploadSingle = (req, res, next) => {
  return upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      // Handle multer specific errors
      console.error('Multer error:', error);
      return res.status(400).json({ result: "Failed", error: 'Error uploading file' });
    } else if (error) {
      // Handle other errors
      console.error('Error uploading file:', error);
      return res.status(500).json({ result: "Failed", error: 'Internal server error' });
    }

    // No error, continue to the next middleware or controller
    next();
  });
}
module.exports = { handleUpload: handleUpload , handleUploadSingle :handleUploadSingle}