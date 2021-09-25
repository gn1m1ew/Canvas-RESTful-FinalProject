<<<<<<< HEAD
const router = require('express').Router();

const { generateAuthToken, requireAuthentication, checkAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const {
    UserSchema,
    getUserByEmail,
    insertNewUser,
    getEnrolledCoursesByStudentId,
    getUserById,
    validateUser,
    getUserPriveleges
  } = require('../models/students');


router.post('/', checkAuthentication, async (req,res,next) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
        // check if a user is an admin, and saitize the input for role
        try {
          if (req.role === 'admin') {
            if (req.body.role !== 'admin' && req.body.role !== 'instructor') {
              req.body.role = 'student';
            }
          } else {
            // if user is not an admin, they can only create students
            if (req.body.role === 'admin' || req.body.role === 'instructor') {
              res.status(403).send({
                error: "User lacks authorization to create instructor or admin accounts."
              });
            } else {
              req.body.role = 'student';
            }
          }
    
          const id = await insertNewUser(req.body);
          res.status(201).send({
            id: id
          });
        } catch (err) {
          console.error(" -- Error:", err);
          res.status(500).send({
            error: "Error inserting new user. Try again later."
          });
        }
      } else {
        res.status(400).send({
          error: "Request body does not contain a valid user."
        });
      }
    });

// router.post('/', async (req, res, next) => {
//     try {
//       console.log('123456')
//     } catch (err) {
//       console.error(" --error:", err);
//       res.status(500).send({
//         err: "Error inserting businesses page from DB."
//       });
//     }
//   });
  


router.post('/login', async (req, res) => {
    if (req.body && req.body.email && req.body.password) {
      try {
        const authenticated = await validateUser(
          req.body.email,
          req.body.password
        );
        if (authenticated) {
          const user = await getUserPriveleges(req.body.email);
          const token = generateAuthToken(user._id, user.role);
          res.status(200).send({
            token: token
          });
        } else {
          res.status(401).send({
            error: "Invalid authentication credentials."
          });
        }
      } catch (err) {
        console.error("  -- error:", err);
        res.status(500).send({
          error: "Error logging in. Try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body needs a user email and password."
      });
    }
});
=======
const router = require('express').Router();

const { generateAuthToken, requireAuthentication, checkAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const {
    UserSchema,
    getUserByEmail,
    insertNewUser,
    getEnrolledCoursesByStudentId,
    getUserById,
    validateUser,
    getUserPriveleges
  } = require('../models/students');


router.post('/', checkAuthentication, async (req,res,next) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
        // check if a user is an admin, and saitize the input for role
        try {
          if (req.role === 'admin') {
            if (req.body.role !== 'admin' && req.body.role !== 'instructor') {
              req.body.role = 'student';
            }
          } else {
            // if user is not an admin, they can only create students
            if (req.body.role === 'admin' || req.body.role === 'instructor') {
              res.status(403).send({
                error: "User lacks authorization to create instructor or admin accounts."
              });
            } else {
              req.body.role = 'student';
            }
          }
    
          const id = await insertNewUser(req.body);
          res.status(201).send({
            id: id
          });
        } catch (err) {
          console.error(" -- Error:", err);
          res.status(500).send({
            error: "Error inserting new user. Try again later."
          });
        }
      } else {
        res.status(400).send({
          error: "Request body does not contain a valid user."
        });
      }
    });

router.post('/', async (req, res, next) => {
    try {
      console.log('123456')
    } catch (err) {
      console.error(" --error:", err);
      res.status(500).send({
        err: "Error inserting businesses page from DB."
      });
    }
  });
  


router.post('/login', async (req, res) => {
    if (req.body && req.body.email && req.body.password) {
      try {
        const authenticated = await validateUser(
          req.body.email,
          req.body.password
        );
        if (authenticated) {
          const user = await getUserPriveleges(req.body.email);
          const token = generateAuthToken(user._id, user.role);
          res.status(200).send({
            token: token
          });
        } else {
          res.status(401).send({
            error: "Invalid authentication credentials."
          });
        }
      } catch (err) {
        console.error("  -- error:", err);
        res.status(500).send({
          error: "Error logging in. Try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body needs a user email and password."
      });
    }
});
>>>>>>> 8b275893ef7f19b420b4db190268f3b7950c45e0
module.exports = router;