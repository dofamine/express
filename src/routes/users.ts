import { Router } from 'express';
import { UserDBModel } from '../mongoose/schemas/user.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await UserDBModel.find({}).select('-password').limit(10);
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;

    if (sort) {
      result.sort((a, b) =>
        sort.toLowerCase() === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      );
    }

    return res.json(result);
  } catch {
    return res.status(404).send('error occurred');
  }
});

router
  .route('/:id')
  .get((_req, res) => {
    res.send(res.locals.requestedUser);
  })
  .patch((_req, res) => {
    res.send(`update user ${String(res.locals.requestedUser)}`);
  })
  .delete((_req, res) => {
    res.send(`deleted user ${String(res.locals.requestedUser)}`);
  });

router.param('id', async (req, res, next, id: string) => {
  try {
    const user = await UserDBModel.findById(id);
    if (!user) {
      return res.status(404).send('User Not Found');
    }

    res.locals.requestedUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
});

export default router;
