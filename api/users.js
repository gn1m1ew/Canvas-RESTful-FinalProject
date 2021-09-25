const router = require('express').Router();
exports.router = router;
const { getDbReference } = require('../lib/mongo');
const { extractValidFields, validateAgainstSchema } = require('../lib/validation');
const ObjectID = require('mongodb').ObjectID;
const { BSONType } = require('mongodb');
const bcrypt = require('bcrypt');
const { generateAuthToken, requireAuthentication, postAuthentication } = require('../lib/auth');

const UserSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    role: { required: true }, // teacher or student
    admin: { required: false }
};

// Get all users---------------------------------------
async function getUserPage() {
    const db = getDbReference();
    const collection = db.collection('users');
    const result = await collection.find({}).toArray();
    return result;
}

// Delete user by Id
async function deleteUserById(id) {
    const db = getDbReference();
    const collection = db.collection('users');
    const result = await collection.deleteOne({
        _id: new ObjectID(id)
    });
    return result.deletedCount > 0;
}

async function insertNewUser(user, check) {
    const userToInsert = extractValidFields(user, UserSchema);

    userToInsert.password = await bcrypt.hash(userToInsert.password, 8); // hash the password and store it into the previous place
    if (check === true) {
        userToInsert.admin = true;
    } else {
        userToInsert.admin = false; // Default admin is false
    }
    const db = getDbReference();
    const collection = db.collection('users');
    const result = await collection.insertOne(userToInsert);
    return result.insertedId;
}

async function getUserById(id, includePassword) {
    const db = getDbReference();
    const collection = db.collection('users');
    if (!ObjectID.isValid(id)) {
        return null;
    } else {
        const projection = includePassword ? {} : { password: 0 }
        const results = await collection.find({ _id: new ObjectID(id) }).project(projection).toArray();
        return results[0];
    }
};

async function getUserByEmail(email, includePassword) {
    const db = getDbReference();
    const collection = db.collection('users');
    const projection = includePassword ? {} : { password: 0 }
    const results = await collection.find({ email: email }).project(projection).toArray();
    return results[0];
};

async function updateUserById(id, user) {
    const userToUpdate = {
        "name": user.name,
        "email": user.email,
        "password": user.password,
        "role": user.role,
        "admin": user.admin
    };
    const db = getDbReference();
    const collection = db.collection('users');

    const result = await collection.replaceOne({ _id: new ObjectID(id) },
        userToUpdate
    );
    return result.matchedCount > 0;
}

async function validateUser(email, password) {
    const user = await getUserByEmail(email, true);
    console.log("return password is", user.password);
    return user && await bcrypt.compare(password, user.password);
}



// User API endpoints below:-----------------------------
router.get('/all', async(req, res) => {
    try {
        const alluser = await getUserPage();
        res.status(200).send(alluser);
    } catch (err) {
        console.error(" --error:", err);
        res.status(500).send({
            err: "Error fetching users from DB."
        });
    }
});

// Post new user (finished)
router.post('/', async(req, res) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
        if (req.admin === true) {
            var x = req.body.admin;
            //console.log("-- body admin is", req.body.admin);
            try {
                const id = await insertNewUser(req.body, x);
                res.status(201).send({
                    _id: id
                });
            } catch (err) {
                res.status(500).send({
                    error: "Error inserting new user."
                });
            }
        } else {
            try {
                const id = await insertNewUser(req.body, false);
                res.status(201).send({
                    _id: id
                });
            } catch (err) {
                res.status(500).send({
                    error: "Error inserting new user."
                });
            }
        }
    } else {
        res.status(400).send({
            error: "Request body does not contain a valid user"
        });
    }
});

router.post('/login', async(req, res) => {
    if (req.body && req.body.email && req.body.password) {
        try {
            const authenticated = await validateUser(req.body.email, req.body.password);
            if (authenticated) {
                const user = await getUserByEmail(req.body.email, true);
                // console.log("login is:", user._id);
                res.status(200).send({
                    token: generateAuthToken(user._id, user.admin)
                });
            } else {
                res.status(401).send({
                    error: "Invalid authentication credentials."
                });
            }
        } catch (err) {
            console.error(" -- error:", err);
            res.status(500).send({
                error: "Error logging in. Try again later."
            });
        }
    } else {
        res.status(400).send({
            error: "Request body needs 'id' and 'password'."
        });
    }
});


router.get('/:id', requireAuthentication, async(req, res, next) => {
    if (req.user === req.params.id || req.admin === true) {
        try {
            const user = await getUserById(req.params.id);
            if (user) {
                res.status(200).send(user);
            } else {
                next();
            }
        } catch (err) {
            res.status(500).send({
                error: "Error fetching user."
            })
        }
    } else {
        res.status(403).send({
            error: "Unauthorized to access the resource"
        });
    }
});

// Modify user's data
router.put('/:id', requireAuthentication, async(req, res, next) => {
    if (req.user === req.params.id || req.admin === true) {
        try {
            const user = await updateUserById(req.params.id, req.body);
            if (user) {
                res.status(200).send("Good");
            } else {
                next();
            }
        } catch (err) {
            res.status(500).send({
                error: "Error fetching user."
            })
        }
    } else {
        res.status(403).send({
            error: "Unauthorized to access the resource"
        });
    }
});
// Later add requireAuthentication to there for only admin can delete the users
router.delete('/:id', requireAuthentication, async(req, res, next) => {
    if (req.user === req.params.id || req.admin === true) {
        try {
            const deleteSuccess = await deleteUserById(req.params.id);
            if (deleteSuccess) {
                res.status(204).send({ deleteSuccess });
            } else {
                next();
            }
        } catch (err) {
            res.status(500).send({
                error: "Unable to delete this user."
            });
        }
    } else {
        res.status(403).send({
            error: "Unauthorized to access the resource"
        });
    }
});