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
const multer = require('multer');
const crypto = require('crypto');
const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq');
const { response } = require('express');



async function getAssignmentByClassId(id) {
    //console.log("== input id is: ", id);
    const db = getDbReference();
    const collection = db.collection('homework');
    if (!ObjectId.isValid(id)) {
        return [];
    } else {
        const results = await collection.find({
            classId: id
        }).toArray();
        return results[0];
    }
}
exports.getAssignmentByClassId = getAssignmentByClassId;

async function getAllhomework() {
    const db = getDbReference();
    const collection = db.collection('homework');
    const result = await collection.find({}).toArray();
    return result;
}

async function insertAssignment(homework) {
    const db = getDbReference();
    const collection = db.collection('homework');
    const result = await collection.insertOne(homework);
    return result.insertedId;
}

async function getAssignmentById(id) {
    const db = getDbReference();
    const collection = db.collection('homework');
    if (!ObjectID.isValid(id)) {
        return null;
    } else {
<<<<<<< HEAD
        const results = await collection.find({ _id: new ObjectID(id) }).project().toArray();
=======
<<<<<<< HEAD
        const results = await collection.find({ _id: new ObjectID(id) }).toArray();
=======
        const results = await collection.find({ _id: new ObjectID(id) }).project().toArray();
>>>>>>> c314d2f1552ea8a54f072e5844f9c07c5488f66c
>>>>>>> 8b275893ef7f19b420b4db190268f3b7950c45e0
        return results[0];
    }
};

async function updateAssignById(id, homework) {
    const dataToUpdate = {
        classId: homework.classId,
        assignmentName: homework.assignmentName,
        assignmentGrade: homework.assignmentGrade,
        due: homework.due
    };
    const db = getDbReference();
    const collection = db.collection('homework');

    const result = await collection.replaceOne({ _id: new ObjectID(id) },
        dataToUpdate
    );
    return result.matchedCount > 0;
}

// Delete a assignment by Id:
async function deleteAssignById(id) {
    const db = getDbReference();
    const collection = db.collection('homework');
    const result = await collection.deleteOne({
        _id: new ObjectID(id)
    });
    return result.deletedCount > 0;
}


// API functon below ----------------------------
router.post('/', async(req, res, next) => {
    if (req.body && req.body.assignmentName && req.body.classId) {
        const homework = {
            classId: req.body.classId,
            assignmentName: req.body.assignmentName,
            assignmentGrade: req.body.assignmentGrade,
            due: req.body.due
        };
        try {
            // const id = await insertPhotoFile(homework);
            // await removeUploadedFile(req.file);
            // const channel = getChannel();
            // channel.sendToQueue('photos', Buffer.from(id.toString()));
            const id = await insertAssignment(homework);
            res.status(200).send({
                id: id
            });
        } catch (err) {
            next(err);
        }
    } else {
        res.status(400).send({
            error: "Request body must contains 'name' and 'classId'"
        })
    }
    res.status(200).send();
});

router.get('/all', async(req, res) => {
    try {
        const alluser = await getAllhomework();
        res.status(200).send(alluser);
    } catch (err) {
        console.error(" --error:", err);
        res.status(500).send({
            err: "Error fetching homeworks from DB."
        });
    }
});

router.get('/:id', async(req, res, next) => {
    try {
        const user = await getAssignmentById(req.params.id);
        if (user) {
            res.status(200).send(user);
        } else {
            next();
        }
    } catch (err) {
        res.status(500).send({
            error: "Error fetching assignment."
        })
    }
});

router.put('/:id', async(req, res, next) => {
    try {
        const user = await updateAssignById(req.params.id, req.body);
        if (user) {
            res.status(200).send("Good");
        } else {
            next();
        }
    } catch (err) {
        res.status(500).send({
            error: "Error fetching homework."
        })
    }
});


router.delete('/:id', async(req, res, next) => {
    try {
        const deleteSuccess = await deleteAssignById(req.params.id);
        if (deleteSuccess) {
            res.status(204).send({ deleteSuccess });
        } else {
            next();
        }
    } catch (err) {
        res.status(500).send({
            error: "Unable to delete assignment."
        });
    }
});