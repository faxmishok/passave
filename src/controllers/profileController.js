const express = require("express");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/user");
const Save = require("../models/save");

//@desc User's dashboard view / DB
//@route GET /profile/dashboard
//@access PRIVATE: 'USER'
exports.getUserDB = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.userId })
    .select("saves first_name last_name username email")
    .populate({
      path: "saves",
      select: "name username email password loginURL",
    });

  if (!user) {
    return next(new ErrorResponse("Something went wrong.", 404));
  }

  return res.status(200).json({
    success: true,
    message: "Welcome to your Dashboard!",
    user,
    nbSaves: user.saves.length,
  });
});

//@desc User's dashboard edit
//@route PUT /profile/dashboard
//@access PRIVATE: 'USER'
exports.updateUserDB = asyncHandler(async (req, res, next) => {
  const update = ({
    first_name,
    last_name,
    username,
    oldPassword,
    newPassword,
    newPasswordConfirmation,
  } = req.body);

  const user = await User.findOne({ _id: req.user.userId });

  if (!user) {
    return next(new ErrorResponse("Requested URL Not Found", 404));
  }

  if (!update.oldPassword || update.oldPassword === "") {
    return next(
      new ErrorResponse(
        "You must enter your password to update your profile",
        403
      )
    );
  }

  const isMatch = user.isMatchedPassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorResponse("Password is incorrect", 403));
  }

  if (newPassword && newPasswordConfirmation) {
    update.password = newPassword;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user.userId },
    update,
    {
      new: true,
      runValidators: true,
    }
  ).select("saves first_name last_name username email");

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    updatedUser,
  });
});

//@desc Add new save
//@route POST /profile/saves/add
//@access PRIVATE: 'USER'
exports.createSave = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  let { name, username, email, password, loginURL } = req.body;

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
    message: `Bounty created and registered to ${user.username}'s account successfully!`,
    user,
  });
});
