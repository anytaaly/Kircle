const express = require('express');
const router = express.Router();
const moment = require('moment');
const _ = require('underscore');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const config = require('../../config/config');

//AWS Dynamo connection &  tables
AWS.config.update(config.aws_remote_config);
docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'user';

//@route    POST api/users
//@desc     Register user
//@acess    Public
router.post(
  '/',
  [
    check('name', 'Name is a required field').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      //check if User exist in mongodb

      let user = await User.findOne({ email });
      if (user) {
        res.status(400).json({
          errors: [{ msg: 'User already exists' }],
        });
      }
      user = new User({
        name,
        email,
        password,
      });

      //Encrpt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);
      //save users in mongodb
      await user.save();

      //return the response
      res.send('User registered in Mongo DB Database database');

      //// This is to post the user to the mongodb cluster
      //saving in dynamo db
      let awsuser = {
        _id: uuidv4(),
        name: name,
        email: email,
        password: await bcrypt.hash(password, salt),
        createdOn: moment().unix(),
        //userExpires: moment().add(90, 'days').unix(),
      };
      //// This is to post the user to the dynamo DB
      docClient.put(
        {
          TableName: tableName,
          Item: awsuser,
        },
        async (err, data) => {
          if (err) {
            console.log(err);
            return res.status(err.statusCode).send({
              message: err.message,
              status: err.statusCode,
            });
          } else {
            return res.status(200).send(awsuser);
          }
        }
      );
    } catch (err) {
      console.log(err.message);
      //req.status(500).send('server error');
    }
  }
);

module.exports = router;
