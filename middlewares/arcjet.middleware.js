import aj from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
    try {
        const decision = await aj.protect(req, {requested: 1});
        if(decision.isDenied()) {
            if(decision.reason.isRateLimit()) {
                res.status(429).json({ message: "Too many requests. Please try again later." });
            } else if(decision.reason.isBot()) {
                res.status(403).json({ message: "Access denied. Bot traffic is not allowed." });
            } else {
                res.status(403).json({ message: "Access denied." });
            }
        }
        else {
            next();
        }
    } catch (error) {
        console.log(`Arcjet Middleware Error: ${error}`);
        next(error);
    }
}

export default arcjetMiddleware;