import membershipService from "../services/membership-service.js";
const register = async (req, res, next) => {
  try {
    const result = await membershipService.register(req.body);
    res.status(200).json({
      status: 0,
      message: "Registrasi berhasil silahkan login",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await membershipService.login(req.body);
    res.status(200).json({
      status: 0,
      message: "Login Sukses",
      data: {
        token: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res, next) => {
  try {
    const userProfile = await membershipService.profile(req.user);
    res.status(200).json({
      status: 0,
      message: "Sukses",
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updateProfile = await membershipService.updateProfile(req);
    res.status(200).json({
      status: 0,
      message: "Update profile berhasil",
      data: updateProfile,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfileImage = async (req, res, next) => {
  try {
    const file = req.file;
    const updatedProfile = await membershipService.updateProfileImage(
      req,
      file
    );

    res.status(200).json({
      status: 0,
      message: "Update Profile Image berhasil",
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  profile,
  updateProfile,
  updateProfileImage,
};

// supridev.com
