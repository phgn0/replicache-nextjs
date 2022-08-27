import { push } from "../backend/push.js";
export async function handlePush(req, res, mutators) {
    if (req.query["spaceID"] === undefined) {
        res.status(400).send("Missing spaceID");
        return;
    }
    const spaceID = req.query["spaceID"].toString();
    await push(spaceID, req.body, mutators);
    res.status(200).json({});
}
