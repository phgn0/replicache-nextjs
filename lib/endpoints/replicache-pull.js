import { pull } from "../backend/pull.js";
export async function handlePull(req, res) {
    if (req.query["spaceID"] === undefined) {
        res.status(400).send("Missing spaceID");
        return;
    }
    const spaceID = req.query["spaceID"].toString();
    const resp = await pull(spaceID, req.body);
    res.json(resp);
    res.end();
}
