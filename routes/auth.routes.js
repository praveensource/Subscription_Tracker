import { Router } from "express";
import { signUp, signIn, signOut } from "../controllers/auth.controller.js";

const authRouter = Router();

// POST /api/v1/auth/sign-up
// POST /api/v1/auth/sign-in
// POST /api/v1/auth/sign-out

authRouter.post('/sign-up', signUp);

authRouter.post('/sign-in', signIn);

authRouter.post('/sign-out', signOut);

export default authRouter;