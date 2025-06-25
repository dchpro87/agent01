#!/usr/bin/env node

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

function checkOllama() {
  loadEnvFile();

  const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const url = new URL(baseURL);

  console.log("🔍 Checking if Ollama is running...");
  console.log(`📍 Checking: ${baseURL}\n`);

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: "/api/tags",
    method: "GET",
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        const models = JSON.parse(data);
        console.log("✅ Ollama is running!");
        console.log(`📊 Available models: ${models.models.length}`);

        if (models.models.length > 0) {
          console.log("\n📋 Installed models:");
          models.models.forEach((model) => {
            console.log(
              `   • ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(
                1
              )}GB)`
            );
          });

          const hasLlama32 = models.models.some((m) =>
            m.name.includes("llama3.2:3b")
          );
          if (hasLlama32) {
            console.log(
              "\n🎉 Great! llama3.2:3b is installed and ready to use."
            );
          } else {
            console.log(
              "\n⚠️  The default model (llama3.2:3b) is not installed."
            );
            console.log("   Run: ollama pull llama3.2:3b");
          }
        } else {
          console.log(
            "\n⚠️  No models installed. Run: ollama pull llama3.2:3b"
          );
        }

        console.log("\n🚀 Your chatbot is ready! Visit http://localhost:3000");
      } else {
        console.log("❌ Ollama responded with error:", res.statusCode);
        showSetupInstructions();
      }
    });
  });

  req.on("error", (err) => {
    console.log("❌ Ollama is not running or not accessible");
    console.log(`   Error: ${err.message}\n`);
    showSetupInstructions();
  });

  req.on("timeout", () => {
    console.log("⏱️  Connection to Ollama timed out\n");
    showSetupInstructions();
  });

  req.end();
}

function showSetupInstructions() {
  console.log("📚 Setup Instructions:");
  console.log("");
  console.log("1. Install Ollama:");
  console.log("   • Windows/Mac: Download from https://ollama.ai");
  console.log("   • Linux: curl -fsSL https://ollama.ai/install.sh | sh");
  console.log("");
  console.log("2. Start Ollama service:");
  console.log("   ollama serve");
  console.log("");
  console.log("3. Install a model:");
  console.log("   ollama pull llama3.2:3b");
  console.log("");
  console.log("4. Verify installation:");
  console.log("   ollama list");
  console.log("");
  console.log(
    "Then run this script again or start your chat at http://localhost:3000"
  );
}

checkOllama();
