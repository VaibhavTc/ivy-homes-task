const axios = require("axios");
const fs = require("fs");

const API_VERSION = "v3";
const RATE_LIMITS = { v1: 100, v2: 50, v3: 80 };
const API_URL = `http://35.200.185.69:8000/${API_VERSION}/autocomplete?query=`;

const MAX_RESULTS = 10;
const letters = "abcdefghijklmnopqrstuvwxyz0123456789- .+";
const MAX_DEPTH = 4;
const DELAY_BETWEEN_REQUESTS = Math.ceil(60000 / RATE_LIMITS[API_VERSION]);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callApi(prefix) {
  await delay(DELAY_BETWEEN_REQUESTS);

  while (true) {
    try {
      const response = await axios.get(`${API_URL}${prefix}`);
      if (response.status === 200) return response.data;

      if (response.status === 429) {
        console.warn(`Rate limited on '${prefix}', retrying in 5 sec.`);
        await delay(5000);
      } else {
        console.warn(
          `Unexpected response ${response.status} for '${prefix}', retrying...`
        );
      }
    } catch (error) {
      console.warn(`Error on '${prefix}': ${error.message}, retrying...`);
      await delay(5000);
    }
  }
}

async function bruteForceSearch(maxDepth = MAX_DEPTH) {
  const allNames = new Set();
  const queue = [""];

  while (queue.length > 0) {
    const prefix = queue.shift(); // Process queries one by one
    const data = await callApi(prefix);

    if (!data) {
      queue.push(prefix); // Re-add failed query to retry later
      continue;
    }

    const results = data.results || [];
    for (const name of results) {
      if (!allNames.has(name)) {
        allNames.add(name);
        console.log(`✅ Found: ${name} | Total: ${allNames.size}`);
      }
    }

    if (prefix.length < maxDepth && results.length >= MAX_RESULTS) {
      for (const char of letters) {
        queue.push(prefix + char);
      }
    }
  }

  return allNames;
}

async function main() {
  console.log(
    `🚀 Starting brute-force search for API version: ${API_VERSION}...`
  );
  const allNames = await bruteForceSearch();
  console.log(`🎉 Total names found: ${allNames.size}`);

  fs.writeFileSync(
    `optimized_names_${API_VERSION}.txt`,
    Array.from(allNames).sort().join("\n"),
    "utf8"
  );
  console.log(`📂 Results saved to optimized_names_${API_VERSION}.txt`);
}

main().catch(console.error);
