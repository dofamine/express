import passport from 'passport';
import { Strategy } from "passport-local"
import { UserDBModel } from "../mongoose/schemas/user.mjs";
import { verifyPassword } from "../utils/password.mjs";

passport.serializeUser((user, done) => {
  done(null, user._id);
})

passport.deserializeUser(async (userId, done) => {
  try {
    const user = await UserDBModel.findById(userId);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport.use(new Strategy({
  usernameField: 'name',
}, async (userName, password, done) => {
  try {
    const findUser = await UserDBModel.findOne({
      name: userName.trim()
    }).select("+password");

    if (!findUser || !(await verifyPassword(String(password), findUser.password))) {
      return done(null, false, {
        message: 'Invalid username or password',
      });
    }
    findUser.lastSeen = new Date();
    await findUser.save();
    findUser.password = undefined;

    done(null, findUser);
  } catch (e) {
    done(e, null)
  }
}))
