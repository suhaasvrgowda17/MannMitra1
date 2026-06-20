import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import journalsRouter from "./journals";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";
import sosRouter from "./sos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(journalsRouter);
router.use(chatRouter);
router.use(dashboardRouter);
router.use(sosRouter);

export default router;
