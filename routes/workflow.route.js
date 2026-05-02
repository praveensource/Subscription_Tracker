import { Router } from "express";
import { sendRemainders, sendRemainderTest } from "../controllers/workflow.controller.js";

const workflowRouter = Router();

// Production route (uses QStash — requires public URL)
workflowRouter.post('/subscription/reminder', sendRemainders);

// Local test route (runs directly — works on localhost)
workflowRouter.post('/subscription/reminder/test', sendRemainderTest);

export default workflowRouter;