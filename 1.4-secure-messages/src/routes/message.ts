import { Router } from "express";

const router = Router();

router.post("/send", (req, res) => {
    const { message } = req.body;
    res.json({ received: message });
});

export default router;
