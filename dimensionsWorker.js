const sizeOf = require('image-size');

const { getDbReference } = require('./lib/mongo');
const { connectToDb } = require('./lib/mongo');
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq');
const { getDownloadStreamById, updateImageDimensionsById, insertPhotoFile, removeUploadedFile } = require('./api/photos');
const { FONT_SANS_10_BLACK } = require('jimp');

const Jimp = require('jimp');
const { ObjectId} = require('mongodb');
const path = require('path');

const array = [128, 256, 640, 1024];

connectToDb(async () => {
    await connectToRabbitMQ('photos');
    const channel = getChannel();
    channel.consume('photos', msg => {
        const id = msg.content.toString();
        console.log("== got message with id:", id);
        const imageChunks = [];
        getDownloadStreamById(id)
            .on('data', chunk => {
                imageChunks.push(chunk);
            })
            .on('end', async () => {
                const db = getDbReference();
                const collection = db.collection('photos.files');
                const result = await collection.find(
                    { _id: new ObjectId(id) }
                ).toArray();

                const list_url = [];
                const thisphoto = Buffer.concat(imageChunks)            // Get the image
                const newphoto = await Jimp.read(thisphoto);
                const dimensions = sizeOf(thisphoto);                   // Get the size of image
                // console.log("  -- input photo dimensions:", dimensions);
                if (dimensions.height > dimensions.width) {
                    for (var i = 0; i < array.length; i++) {
                        if (dimensions.height > array[i]) {
                            const buf = await newphoto.resize(array[i], Jimp.AUTO)
                                .write(result[0].metadata.destination + `/${id}-` + array[i] + `.jpg`)
                                .getBufferAsync(Jimp.MIME_JPEG);
                            const image = {
                                path: path.resolve(result[0].metadata.destination + '/' + `${id}-` + array[i] + `.jpg`),
                                url: `/media/images/${id}-` + array[i] + `.jpg`,
                                size: array[i],
                                filename: `${id}-` + array[i] + `.jpg`,
                                contentType: `image/jpeg`,
                                destination: result[0].metadata.destination,
                                userId: result[0].metadata.userId,
                                businessid: result[0].metadata.businessid,
                            }
                            await insertPhotoFile(image);
                            list_url.push(image.url);
                            await removeUploadedFile(image);
                        }
                    }
                } else {
                    for (var i = 0; i < array.length; i++) {
                        if (dimensions.width > array[i]) {
                            // console.log("== destination is", result[0].metadata.destination);
                            const buf = await newphoto.resize(array[i], Jimp.AUTO)
                                .write(result[0].metadata.destination + `/${id}-` + array[i] + `.jpg`)
                                .getBufferAsync(Jimp.MIME_JPEG);
                            const image = {
                                path: path.resolve(result[0].metadata.destination + '/' + `${id}-` + array[i] + `.jpg`),
                                link: `/media/images/${id}-` + array[i] + `.jpg`,
                                size: array[i],
                                filename: `${id}-` + array[i] + `.jpg`,
                                contentType: `image/jpeg`,
                                destination: result[0].metadata.destination,
                                userId: result[0].metadata.userId,
                                businessid: result[0].metadata.businessid
                            }
                            // console.log("== going to insert");
                            await insertPhotoFile(image);
                            // console.log("== ending of insert");
                            list_url.push(image.link);
                            // console.log("== path", image.path);
                            await removeUploadedFile(image);
                        }
                    }
                }
                
                
                console.log("== list of url is", list_url);
                const check = await updateImageDimensionsById(id, dimensions, list_url);
                console.log("  -- update result:", check);
            });
        channel.ack(msg);
    });
});