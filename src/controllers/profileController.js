const express = require("express");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/user");
const Save = require("../models/save");

//@desc User's dashboard view / DB
//@route GET /profile/dashboard
//@access PRIVATE: 'VERIFIED'
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
//@access PRIVATE: 'VERIFIED'
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
//@access PRIVATE: 'VERIFIED'
exports.createSave = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  let { name, username, email, password, loginURL } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse("Something went wrong.", 404));
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
    //TODO error
    // user.,
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
    .select("saves")
    .populate({ path: "saves", match: { _id: saveId } });

  const save = await Save.findOneAndUpdate({ _id: req.params.id }, update, {
    new: true,
    runValidators: true,
  });

  if (!save) {
    return next(new ErrorResponse("Save does not exist!", 404));
  }

  return res.status(200).json({
    success: true,
    message: "Save Updated Successfully!",
    save,
  });
});

//@desc   Delete Save with Id
//@route  DELETE /profile/saves/:id
//@access PRIVATE : 'VERIFIED'
exports.deleteSave = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const saveId = req.params.id;

  const user = await User.findById(userId)
    .select("saves")
    .populate({ path: "saves", match: { _id: saveId } });

  if (user.saves.length === 0)
    return next(new ErrorResponse("Save does not exist!", 404));

  user.saves.remove(saveId);
  await user.save();

  await Save.findByIdAndDelete(saveId);

  return res.status(200).json({
    success: true,
    message: "Save Deleted Successfully!",
  });
});
