<<<<<<< HEAD
const router = require('express').Router();

const { generateAuthToken, requireAuthentication, checkAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const { 
    getUserById,
    getCoursesByStudentId
  } = require('./users');

router.get('/:id', requireAuthentication, async (req, res, next) => {
    try {
      let user = await getUserById(req.params.id, false);
      if (user) {
        if (req.userId !== req.params.id) {
          res.status(403).send({
            error: "Unauthorized to access the specified resource."
          });
        } else {
          if (user.role === 'teacher') {
            user.courses = await getCoursesByInstructorId(user._id);
          } else if (user.role === 'student') {
            user.courses = await getCoursesByStudentId(user._id);
          }
          res.status(200).send(user);
        }
      } else {
        next();
      }
    } catch (err) {
      console.error("  -- Error:", err);
      res.status(500).send({
        error: "Error fetching user. Try again later."
      });
    }
=======
const router = require('express').Router();

const { generateAuthToken, requireAuthentication, checkAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const { 
    getUserById,
    getCoursesByStudentId
  } = require('../models/users');

router.get('/:id', requireAuthentication, async (req, res, next) => {
    try {
      let user = await getUserById(req.params.id, false);
      if (user) {
        if (req.userId !== req.params.id) {
          res.status(403).send({
            error: "Unauthorized to access the specified resource."
          });
        } else {
          if (user.role === 'instructor') {
            user.courses = await getCoursesByInstructorId(user._id);
          } else if (user.role === 'student') {
            user.courses = await getCoursesByStudentId(user._id);
          }
          res.status(200).send(user);
        }
      } else {
        next();
      }
    } catch (err) {
      console.error("  -- Error:", err);
      res.status(500).send({
        error: "Error fetching user. Try again later."
      });
    }
>>>>>>> 8b275893ef7f19b420b4db190268f3b7950c45e0
});