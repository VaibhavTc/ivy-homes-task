# ivy-homes-task
Ivy Homes Task Submission
# 🔍 Brute Force Autocomplete Search

This project performs a brute-force search using an autocomplete API for different versions (`v1`, `v2`, and `v3`). The script explores all possible query prefixes and extracts the available names from the API responses.

---

## 🚀 How It Works

- The script sends requests to the API using different prefixes.
- It waits for a **defined delay** before making the next request to respect the rate limits.
- If an API call fails, it **automatically retries** instead of skipping the query.
- Results are stored in a text file (`optimized_names_v1.txt`, `optimized_names_v2.txt`, or `optimized_names_v3.txt`).

---

## 📌 API Versions and Differences

| Version | Included Characters            | Rate Limit (per min) | Delay Between Requests (ms) |
|---------|--------------------------------|----------------------|-----------------------------|
| **v1**  | `abcdefghijklmnopqrstuvwxyz`  | 100                  | 600                         |
| **v2**  | `abcdefghijklmnopqrstuvwxyz0123456789` | 50  | 1200                        |
| **v3**  | `abcdefghijklmnopqrstuvwxyz0123456789 +.-` | 80  | 750                         |

**🔹 Explanation:**
- **v1** supports only lowercase English letters.
- **v2** includes **numbers** (`0-9`) along with letters.
- **v3** supports **letters, numbers, and special characters** (`+. -`).
- The delay between requests is dynamically adjusted based on the rate limit for each version.

---

## 🛠 Setup and Usage

### 1️⃣ **Install Dependencies**
Make sure you have Node.js installed. Then, install the required dependencies:

```sh
npm install axios fs
```
### 2️⃣ **Run the Script**
```sh
npm install
