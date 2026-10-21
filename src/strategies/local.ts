import passport from 'passport';
import { Strategy } from 'passport-local';
import { UserDBModel } from '../mongoose/schemas/user.js';
import { verifyPassword } from '../utils/password.js';

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (userId: string, done) => {
  try {
    const user = await UserDBModel.findById(userId);
    done(null, user ?? false);
  } catch (error) {
    done(error);
  }
});

export default passport.use(
  new Strategy(
    {
      usernameField: 'name',
    },
    async (userName, password, done) => {
      try {
        const foundUser = await UserDBModel.findOne({
          name: userName.trim(),
        }).select('+password');

        if (
          !foundUser ||
          !(await verifyPassword(String(password), foundUser.password))
        ) {
          return done(null, false, {
            message: 'Invalid username or password',
          });
        }

        foundUser.lastSeen = new Date();
        await foundUser.save();
        foundUser.set('password', undefined);

        return done(null, foundUser);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
