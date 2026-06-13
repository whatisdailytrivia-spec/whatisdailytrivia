const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const upstash = async (command, ...args) => {
    const res = await fetch(`${UPSTASH_URL}`, {
          method: "POST",
          headers: {
                  Authorization: `Bearer ${UPSTASH_TOKEN}`,
                  "Content-Type": "application/json",
          },
          body: JSON.stringify([command, ...args]),
    });
    const data = await res.json();
    return data.result;
};

app.get("/api/storage/:key", async (req, res) => {
    try {
          const value = await upstash("GET", req.params.key);
          if (value === null) return res.status(404).json({ error: "Not found" });
          res.json({ key: req.params.key, value });
    } catch (e) {
          res.status(500).json({ error: e.message });
    }
});

app.post("/api/storage", async (req, res) => {
    try {
          const { key, value } = req.body;
          if (!key) return res.status(400).json({ error: "key is required" });
          await upstash("SET", key, value);
          res.json({ key, value });
    } catch (e) {
          res.status(500).json({ error: e.message });
    }
});

app.delete("/api/storage/:key", async (req, res) => {
    try {
          await upstash("DEL", req.params.key);
          res.json({ key: req.params.key, deleted: true });
    } catch (e) {
          res.status(500).json({ error: e.message });
    }
});

app.get("/api/storage", async (req, res) => {
    try {
          const prefix = req.query.prefix || "";
          const keys = await upstash("KEYS", `${prefix}*`);
          res.json({ keys: keys || [] });
    } catch (e) {
          res.status(500).json({ error: e.message });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`WhatIs... server running on port ${PORT}`);
});
