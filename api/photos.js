const router = require('express').Router();
const validation = require('../lib/validation');
const express = require('express');

const { getDbReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

exports.router = router;
const { ObjectId, GridFSBucket } = require('mongodb');
const ObjectID = require('mongodb').ObjectID;

const bcrypt = require('bcrypt');
const { generateAuthToken, requireAuthentication, postAuthentication } = require('../lib/auth');

const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq');
const { response } = require('express');

const Jimp = require('jimp');
const sizeOf = require('image-size');

const accetpedFileTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

// const upload = multer({ dest:`${__dirname}/uploads`});
const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = accetpedFileTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    //console.log("== in fileFilter:", file);
    callback(null, !!accetpedFileTypes[file.mimetype])
  }
});

// router.use(express.static(`${__dirname}/uploads`));      // This is grab from upload file

function removeUploadedFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
exports.removeUploadedFile = removeUploadedFile;
// Function about inserting and getting ---------------------------------------
//  Error: getDBReference is not defined

async function insertPhotoFile(photo){          // similiar with saveImageFile
  return new Promise((resolve, reject) => {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: 'photos' });
    // console.log("== bucket is ", bucket);
    const metadata = {
      destination: photo.destination,
      contentType: photo.contentType,
      link: photo.link,
      size: photo.size,
      userId: photo.userId,
      businessid: photo.businessid
    };
    console.log("== photo path is", photo.path);
    const uploadStream = bucket.openUploadStream(     //Allow us pass in Gridfs
      photo.filename,
      { metadata: metadata }
    );
    fs.createReadStream(photo.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  });
}
exports.insertPhotoFile = insertPhotoFile;

exports.getPhotoDownloadStreamByFilename = function(filename){
  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  return bucket.openDownloadStreamByName(filename);
}

exports.getDownloadStreamById = function (id) {
  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
};

async function getPhotosById(id) {
  const db = getDbReference();
  // const collection = db.collection('photos');
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket
      // .find({ businessid: new ObjectId(id) })
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}


exports.updateImageDimensionsById = async function (id, dimensions, list_url) {
  const db = getDbReference();
  const collection = db.collection('photos.files');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    console.log("== working on update!!!");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { "metadata.dimensions": dimensions, "list_sub_photos:": list_url  } }
    );
    return result.matchedCount > 0;
  }
};


/*
 * Route to create a new photo.
 */

async function getPhotosByBusinessId(id) {
  //console.log("== busine id is: ", id);
  const db = getDbReference();
  // const collection = db.collection('photos');
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  if (!ObjectId.isValid(id)) {
    return [];
  } else {
    //console.log("== searching!");
    const results = await bucket
      .find({ 'metadata.businessid': id })
      .toArray();
    //console.log("== result is", results);
    return results[0];
  }
}
exports.getPhotosByBusinessId = getPhotosByBusinessId;

async function getPhotosPage() {
  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });

  const results = await bucket.find({})       //await is promise
    .sort({ _id: 1 })
    .toArray(); 
  return results;
}

// Cannot delete this part:-------------------------------
async function deleteAllPhotos(){
  // console.log("== id is", id);
  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  // bucket.delete(ObjectId(id), function(error){
  //   test.equal(error,null);
  // });
  const results = await bucket.find({})       //await is promise
    .sort({ _id: 1 })
    .toArray();
  for(var i=0;i<results.length;i++){
    await bucket.delete(ObjectId(results[i]._id));
  }
  return result.deletedCount > 0;
}


router.post('/', upload.single('photo'), async (req, res, next) => {
  //console.log("== req.body:", req.body);
  console.log("== req.file:", req.file);
  if (req.file && req.body && req.body.userId) {
    const image = {
      link: '/media/images/' + req.file.filename,
      destination: req.file.destination,
      contentType: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      userId: req.body.userId,
      businessid: req.body.businessid
    };
    try {
      // const id = await insertNewPhotos(image);
      const id = await insertPhotoFile(image);
      await removeUploadedFile(req.file);

      // Before send the server, we connect to our queue 'photos'
      const channel = getChannel();
      channel.sendToQueue('photos', Buffer.from(id.toString()));

      res.status(200).send({
        id: id
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      error: "Request body must contains 'image' and 'userId'"
    })
  }
  res.status(200).send();
});

router.get('/', async(req,res,next) =>{
  try {
    const responseBody = await getPhotosPage();
    res.status(200).send(responseBody);
  } catch (err) {
    console.error(" --error:", err);
    res.status(500).send({
      err: "Unable to fetch Photos."
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotosById(req.params.id);
    if (photo) {
      // delete photo.path;
      // photo.url = `/media/images/${photo.filename}`;
      console.log("=== showing the photo by id");
      const responseBody = {
        _id: photo._id,
        url: `/media/images/${photo.filename}`,
        contentType: photo.metadata.contentType,
        userId: photo.metadata.userId,
        businessid: photo.metadata.businessid,
        dimensions: photo.metadata.dimensions,
        url_list: photo.metadata.list_url
      }
      res.status(200).send(photo);
    } else {
      next();
    }
  } catch (err) {
    console.error(" --error:", err);
    res.status(500).send({
      err: "Unable to fetch Photos."
    });
  }
});

/*
 * Route to delete a photo.
 */
router.delete('/', async (req, res, next) => {
  try {
    const deleteSuccess = await deleteAllPhotos();
    if (deleteSuccess) {
      res.status(204).send({ deleteSuccess });
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete photos."
    });
  }
});