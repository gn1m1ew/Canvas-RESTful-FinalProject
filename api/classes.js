const router = require('express').Router();
const validation = require('../lib/validation');
const { getDbReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
const ObjectID = require('mongodb').ObjectID;
const { BSONType } = require('mongodb');
exports.router = router;
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true, useUnifiedTopology: true });
const bcrypt = require('bcrypt');
const { generateAuthToken, requireAuthentication, postAuthentication } = require('../lib/auth');


const classSchema = {
    studentId: { required: false },
    teacherId: { required: true },
    name: { required: true },
    term: { require: true },
    assignment: { require: false }
};

// Get all the classes into a page:
async function getClassesPage(page) {
    const db = getDbReference();
    const collection = db.collection('classes');

    const count = await collection.countDocuments();
    const numPerPage = 10;
    const lastPage = Math.ceil(count / numPerPage);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * numPerPage;

    const results = await collection.find({})
        .sort({ _id: 1 })
        .skip(offset)
        .limit(numPerPage)
        .toArray();

    const links = {};
    if (page < lastPage) {
        links.nextPage = `/classes?page=${page + 1}`;
        links.lastPage = `/classes?page=${lastPage}`;
    }
    if (page > 1) {
        links.prevPage = `/classes?page=${page - 1}`;
        links.firstPage = '/classes?page=1';
    }
    return {
        classes: results,
        page: page,
        totalPages: lastPage,
        numPerPage: numPerPage,
        count: count,
        links: links
    };
}

// Insert a new class:
async function insertNewClass(Aclass) {
    const db = getDbReference();
    const collection = db.collection('classes');
    const result = await collection.insertOne(Aclass);
    return result.insertedId;
}

// Get a class data by Id:
async function getClassById(id) {
    const db = getDbReference();
    const collection = db.collection('classes');
    if (!ObjectID.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({ _id: new ObjectID(id) })
            .toArray();
        return results[0];
    }
}

// Get class detail by Id includes class data:
async function getClassDetailsById(id) {
    const result = await getClassById(id);
    if (result) {
        // result.photos = await getAssignmentByClassId(id);                //??? Wait for assignment
    }
    return result;
}

// Delete a class by Id:
async function deleteClassById(id) {
    const db = getDbReference();
    const collection = db.collection('classes');
    const result = await collection.deleteOne({
        _id: new ObjectID(id)
    });
    return result.deletedCount > 0;
}


// API functions below---------------------------------------
// Get function
router.get('/', async(req, res) => {
    try {
        const classPage = await getClassesPage(parseInt(req.query.page) || 1);
        res.status(200).send(classPage);
    } catch (err) {
        console.error(" --error:", err);
        res.status(500).send({
            err: "Error fetching classes list.  Please try again later."
        });
    }
});

router.post('/', async(req, res, next) => {
    try {
        const result = validation.extractValidFields(req.body, classSchema);
        const id = await insertNewClass(req.body);
        res.status(201).json({
            id: id,
            links: {
                class: `/classes/${id}`
            }
        });
    } catch (err) {
        console.error(" --error:", err);
        res.status(500).send({
            err: "Error inserting Class page to the DB."
        });
    }
});

router.get('/:id', async(req, res, next) => {
    try {
        // console.log("input id is", req.params.id);
        const check = await getClassDetailsById(req.params.id);
        if (check) {
            res.status(200).send(check);
        } else {
            next();
        }
    } catch (err) {
        console.error(" --error:", err);
        res.status(500).send({
            err: "Unable to fetch class."
        });
    }
});

router.delete('/:id', async(req, res, next) => {
    try {
        const deleteSuccess = await deleteClassById(req.params.id);
        if (deleteSuccess) {
            res.status(204).send({ deleteSuccess });
        } else {
            next();
        }
    } catch (err) {
        res.status(500).send({
            error: "Unable to delete class."
        });
    }
});
