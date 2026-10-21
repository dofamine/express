import { Router } from "express";
import { UserDBModel } from "../mongoose/schemas/user.mjs";

const router = Router();

router.route("/").get(async (req, res) => {
  try {
    let result = await UserDBModel.find({}).select("-password").limit(10);
    if (req.query.sort) {
      result.sort((a, b) =>
        req.query.sort.toLowerCase() === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      )
    }
    return res.json(result);
  } catch (e) {
    return res.status(404).send("error occurred");
  }
})

router.route("/:id").get((req, res) => {
  res.send(req.user);
}).patch((req, res) => {
  res.send('update user ' + req.user);
}).delete((req, res) => {
  res.send('deleted user ' + req.user);
})

router.param("id", async (req, res, next) => {
  const id = req.params.id;
  const user = await UserDBModel.findById(id);
  if (!user) {
    return res.status(404).send("User Not Found");
  }
  req.user = user
  next();
})

export default router;
