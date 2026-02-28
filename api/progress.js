import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "progress", "progress.json");

  // garante que existe
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}");
  }

  if (req.method === "GET") {
    const data = fs.readFileSync(filePath, "utf-8");
    res.status(200).json(JSON.parse(data));
    return;
  }

  if (req.method === "POST") {
    const body = req.body;
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
    res.status(200).json({ status: "ok" });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}