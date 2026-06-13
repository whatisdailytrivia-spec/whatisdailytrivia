const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

const DB_URL = process.env.REPLIT_DB_URL;

const dbGet = async (key) => {
  const res = await fetch(`${DB_URL}/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
      return res.text();
      };

      const dbSet = async (key, value) => {
        await fetch(DB_URL, {
            method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
                      });
                      };

                      const dbDelete = async (key) => {
                        await fetch(`${DB_URL}/${encodeURIComponent(key)}`, { method: "DELETE" });
                        };

                        const dbList = async (prefix = "") => {
                          const res = await fetch(`${DB_URL}?prefix=${encodeURIComponent(prefix)}&encode=true`);
                            const text = await res.text();
                              return text.split("\n").filter(Boolean).map(decodeURIComponent);
                              };

                              app.get("/api/storage/:key", async (req, res) => {
                                try {
                                    const value = await dbGet(req.params.key);
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
                                                                  await dbSet(key, value);
                                                                      res.json({ key, value });
                                                                        } catch (e) {
                                                                            res.status(500).json({ error: e.message });
                                                                              }
                                                                              });

                                                                              app.delete("/api/storage/:key", async (req, res) => {
                                                                                try {
                                                                                    await dbDelete(req.params.key);
                                                                                        res.json({ key: req.params.key, deleted: true });
                                                                                          } catch (e) {
                                                                                              res.status(500).json({ error: e.message });
                                                                                                }
                                                                                                });

                                                                                                app.get("/api/storage", async (req, res) => {
                                                                                                  try {
                                                                                                      const keys = await dbList(req.query.prefix || "");
                                                                                                          res.json({ keys });
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
