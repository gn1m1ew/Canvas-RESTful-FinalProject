const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema for a User.
 */
const UserSchema = {
 name: { required: true },
 email: { required: true },
 password: { required: true },
 role: { required: true }
};
exports.UserSchema = UserSchema;


exports.insertNewUser = async function(user){
    const newUser = extractValidFields(student, StudentSchema)
    console.log ("--users", newUser)
    newStudent.password = await bcrypt.hash(
        userToinsert.password,
        10
    )
    console.log("password after hash", newUser)
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertOne(newUser);
    return result.insertedId
}

exports.getUserById = async function (id, vaildpassword){
    const db = getDbReference()
    const collection = db.collection('users')
    if(!ObjectId.isValid(id)){
        return null;
    }else{
        const checkpassword = vaildpassword ? {} : { password: 0}
        const results = await collection.find({ _id: new ObjectId(id)}).project(checkpassword).toArray()
        return results[0]
    }
}

exports.getUserByEmail = async function (email, includePassword) {
    const db = getDBReference();
    const collection = db.collection('users');
    const projection = includePassword ? {} : { password: 0};
    const results = await collection.find({ email: email }).project(projection).toArray();
    return results[0];
};

exports.validateUser = async function (email, password) {
    const user = await exports.getUserByEmail(email, true);
    return user &&
      await bcrypt.compare(password, user.password);
};

exports.getUserPriveleges = async function (email) {
    const db = getDBReference();
    const collection = db.collection('users');
    const results = await collection
      .find({ email: email })
      .project({ role: 1 })
      .toArray();
    return results[0];
};


exports.getEnrolledCoursesByStudentId = async function (id) {
    const db = getDBReference();
    const collection = db.collection('classes');
    if (!ObjectId.isValid(id)) {
      return null;
    } else {
      const results = await collection
        .find({ students: new ObjectId(id) })
        .project({ _id: 1 })
        .map( course => course._id)
        .toArray();
      return results;
    }
};

exports.getCoursesByInstructorId = async function (id) {
    const db = getDBReference();
    const collection = db.collection('classes');
    if (!ObjectId.isValid(id)) {
      return null;
    } else {
      const results = await collection
        .find({ TeacherId: new ObjectId(id) })
        .project({ _id: 1 })
        .map(course => course._id)
        .toArray();
      return results;
    }
};