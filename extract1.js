const axios = require("axios");
const fs = require("fs");

const baseUrl = "http://35.200.185.69:8000/v1/autocomplete";
const results = new Set();
const checkedQueries = new Set();
const zeroResultQueries = new Set();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const letters = "abcdefghijklmnopqrstuvwxyz".split("");

// Load existing names from names_v1.txt if available
if (fs.existsSync("names_v1.txt")) {
  const existingNames = fs.readFileSync("names_v1.txt", "utf8").split("\n");
  existingNames.forEach((name) => results.add(name.trim()));
  console.log(`Loaded ${results.size} existing names.`);
}

// Function to log searched queries
function logSearchedQuery(query, count) {
  fs.appendFileSync("searched_queries.txt", `${query},${count}\n`, "utf8");
}

// Function to fetch suggestions
async function fetchSuggestions(query) {
  if (checkedQueries.has(query) || zeroResultQueries.has(query)) return [];

  await delay(600);

  try {
    console.log(`Searching for '${query}'...`);
    const response = await axios.get(`${baseUrl}?query=${query}`);

    const remaining = response.headers["x-ratelimit-remaining"] || 10;
    if (remaining < 5) {
      console.warn("Approaching rate limit, delaying...");
      await delay(5000);
    }

    checkedQueries.add(query);
    const suggestions = response.data.results || [];
    logSearchedQuery(query, suggestions.length);

    if (suggestions.length === 0) {
      zeroResultQueries.add(query);
      return [];
    }

    return suggestions;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`Rate limit hit for '${query}', retrying after 5s...`);
      await delay(5000);
      return fetchSuggestions(query);
    }
    console.warn(`Error fetching '${query}': ${error.message}`);
    return [];
  }
}

// Function to expand queries by adding letters one by one
async function expandQuery(query) {
  if (query.length > 5 || zeroResultQueries.has(query)) return; // Limit depth

  const suggestions = await fetchSuggestions(query);
  if (suggestions.length === 0) return;

  for (const suggestion of suggestions) {
    if (!results.has(suggestion) && suggestion.length <= 5) {
      results.add(suggestion);
      console.log(`Found: ${results.size}`);
      await expandQuery(suggestion);
    }
  }

  for (const char of letters) {
    const newQuery = query + char;
    if (
      newQuery.length <= 5 &&
      !results.has(newQuery) &&
      !zeroResultQueries.has(newQuery)
    ) {
      const subResults = await fetchSuggestions(newQuery);
      if (subResults.length > 0) {
        results.add(newQuery);
        await expandQuery(newQuery);
      }
    }
  }
}

// Function to perform multiple iterations
async function start() {
  for (let iteration = 1; iteration <= 2; iteration++) {
    console.log(`\n🔄 Starting Iteration ${iteration}...`);
    const currentNames = Array.from(results).filter((name) => name.length <= 5); // Filter only names <= 5 letters

    for (const name of currentNames) {
      for (const char of letters) {
        const newQuery = name + char;
        if (
          newQuery.length <= 5 &&
          !results.has(newQuery) &&
          !zeroResultQueries.has(newQuery)
        ) {
          const subResults = await fetchSuggestions(newQuery);
          if (subResults.length > 0) {
            results.add(newQuery);
            await expandQuery(newQuery);
          }
        }
      }
    }

    fs.writeFileSync(
      `names_v1_iter${iteration}.txt`,
      Array.from(results).join("\n"),
      "utf8"
    );
    console.log(
      `✅ Iteration ${iteration} complete. Total names found: ${results.size}`
    );
  }

  fs.writeFileSync(
    "final_names_v1.txt",
    Array.from(results).join("\n"),
    "utf8"
  );
  console.log(`\n🎉 Final count of extracted names: ${results.size}`);
}

start().catch(console.error);
