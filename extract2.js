const axios = require("axios");
const fs = require("fs");

const baseUrl = "http://35.200.185.69:8000/v2/autocomplete";
const results = new Set();
const checkedQueries = new Set();
const zeroResultQueries = new Set(); // Store queries that returned 0 results
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const letters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");

// Function to log searched queries
function logSearchedQuery(query, count) {
  fs.appendFileSync("searched_queries_v2.txt", `${query},${count}\n`, "utf8");
}

// Function to fetch suggestions
async function fetchSuggestions(query) {
  if (checkedQueries.has(query) || zeroResultQueries.has(query)) return []; // Skip if already searched or marked as zero

  await delay(500); // Ensure one request at a time

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
    logSearchedQuery(query, suggestions.length); // Log query and result count

    if (suggestions.length === 0) {
      zeroResultQueries.add(query); // Mark as zero-result query
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

// Function to expand queries up to length 4
async function expandQuery(query) {
  if (query.length > 3 || zeroResultQueries.has(query)) return; // Stop early if zero results

  const suggestions = await fetchSuggestions(query);
  if (suggestions.length === 0) return; // Stop expanding if no suggestions

  for (const suggestion of suggestions) {
    if (!results.has(suggestion)) {
      results.add(suggestion);
      console.log(`Found: ${results.size}`);
      await expandQuery(suggestion);
    }
  }

  for (const char of letters) {
    const newQuery = query + char;
    if (!results.has(newQuery) && !zeroResultQueries.has(newQuery)) {
      const subResults = await fetchSuggestions(newQuery);
      if (subResults.length > 0) {
        results.add(newQuery);
        await expandQuery(newQuery);
      }
    }
  }
  await delay(1000);
}

// Start function to run all queries
async function start() {
  console.log("Starting search...");
  for (const letter of letters) {
    await expandQuery(letter);
    await delay(2000); // Prevent excessive requests
  }
  fs.writeFileSync("names_v2.txt", Array.from(results).join("\n"), "utf8");
  console.log(`Total names extracted (V2): ${results.size}`);
}

start().catch(console.error);
