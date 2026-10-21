import { Router } from "express";
import users from "./users.mjs";

const router = Router();

router.use('/users', users);

export default router;
