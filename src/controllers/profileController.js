const express = require('express');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');
const Save = require('../models/save');
const bcrypt = require('bcryptjs');

//@desc User's dashboard view / DB
//@route GET /profile/dashboard
//@access PRIVATE: 'VERIFIED'
exports.getUserDB = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.userId })
    .select('saves first_name last_name username email')
    .populate({
      path: 'saves',
      select:
        'name username email password registered_number loginURL additional',
    });

  if (!user) {
    return next(new ErrorResponse('Something went wrong.', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Welcome to your Dashboard!',
    user,
    nbSaves: user.saves.length,
  });
});

//@desc User's dashboard edit
//@route PUT /profile/dashboard
//@access PRIVATE: 'VERIFIED'
exports.updateUserDB = asyncHandler(async (req, res, next) => {
  const update = await ({
    first_name,
    last_name,
    username,
    oldPassword,
    newPassword,
    newPasswordConfirmation,
  } = req.body);

  const user = await User.findOne({ _id: req.user.userId });

  if (!user) {
    // return res.render('sign-in', {
    //   title: 'Passave | Sign in',
    //   code: 'red',
    //   message: 'Error fetching database. Try signing in again.',
    // });
    return res.status(403).json({
      success: false,
      message: 'Error fetching database. Try signing in again.',
    });
  }

  if (!update.oldPassword || update.oldPassword === '') {
    // return res.render('dashboard', {
    //   title: 'Passave | Dashboard',
    //   code: 'red',
    //   message: 'You must enter your password to update profile data.',
    // });
    return res.status(403).json({
      success: false,
      message: 'You must enter your passwd to update profile data.',
    });
  }

  const isMatch = user.isMatchedPassword(oldPassword);
  if (!isMatch) {
    // return res.render('dashboard', {
    //   title: 'Passave | Dashboard',
    //   code: 'red',
    //   message: 'Entered password is incorrect!',
    // });
    return res.status(403).json({
      success: false,
      message: 'Entered passwd is incorrrr',
    });
  }

  if (update.newPassword || update.newPasswordConfirmation) {
    if (update.newPassword === update.newPasswordConfirmation) {
      user.password = newPassword;
      await user.save();
      delete update.newPassword;
      delete update.newPasswordConfirmation;
      delete update.oldPassword;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Submitted new password and confirmation do not match.',
      });
    }
  }

  await User.findOneAndUpdate({ _id: req.user.userId }, update, {
    new: true,
    runValidators: true,
  })
    .select('saves first_name last_name username email')
    .then((updatedUser) => {
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        updatedUser,
      });
    })
    .catch((err) => {
      // return res.render('dashboard', {
      //   title: 'Passave | Dashboard',
      //   code: 'red',
      //   message: `Profile could not be updated due to ${err}`,
      // });
      return res.status(303).json({
        success: false,
        message: `Profile could not be updated due to the ${err}`,
      });
    });

  // return res.status(200).json({
  //   success: true,
  //   message: 'Profile updated successfully!',
  //   updatedUser,
  // });
});

//@desc Add new save
//@route POST /profile/saves/add
//@access PRIVATE: 'VERIFIED'
exports.createSave = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  let { name, username, email, password, loginURL } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('Something went wrong.', 404));
  }

  const save = new Save({
    name,
    username,
    email,
    password,
    loginURL,
    user: userId,
  });

  await save.save();

  user.saves.push(save);
  await user.save();

  return res.status(201).json({
    success: true,
    message: `Save created and registered to ${user.username}'s account successfully!`,
  });
});

//@desc Update Save with Id
//@route PUT /profile/saves/:id
//@access PRIVATE: 'VERIFIED'
exports.updateSave = asyncHandler(async (req, res, next) => {
  const update = ({ name, username, email, password, loginURL } = req.body);

  const userId = req.user.userId;
  const saveId = req.params.id;

  const user = await User.findById(userId)
    .select('saves')
    .populate({ path: 'saves', match: { _id: saveId } });

  await Save.findById(saveId)
    .then()
    .catch((err) => {
      res.status(404).json({
        success: false,
        message: `Save couldn't found: ${err}`,
      });
    });

  await Save.findOneAndUpdate({ _id: saveId }, update, {
    new: true,
    runValidators: true,
  })
    .then((updatedSave) => {
      return res.status(200).json({
        success: true,
        message: 'Save updated successfully!',
        updatedSave,
      });
    })
    .catch((err) => {
      return res.status(404).json({
        success: false,
        message: `Error updating the save: ${err}`,
      });
    });

  // return res.status(200).json({
  //   success: true,
  //   message: 'Save Updated Successfully!',
  //   save,
  // });
});

//@desc   Delete Save with Id
//@route  DELETE /profile/saves/:id
//@access PRIVATE : 'VERIFIED'
exports.deleteSave = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const saveId = req.params.id;

  const user = await User.findById(userId)
    .select('saves')
    .populate({ path: 'saves', match: { _id: saveId } })
    .then((user) => {})
    .catch((err) => {
      return res.status(404).json({
        success: false,
        message: `Error: ${err}`,
      });
    });

  user.saves.remove(saveId);
  await user.save();

  await Save.findByIdAndDelete(saveId);

  return res.status(200).json({
    success: true,
    message: 'Save Deleted Successfully!',
  });
});
