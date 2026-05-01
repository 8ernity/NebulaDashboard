const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());

const HISTORY_PATHS = [
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'History'),
    path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'History'),
    path.join(os.homedir(), 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'History')
];

const TEMP_HISTORY_PATH = path.join(__dirname, 'History_Copy');

app.get('/api/history', (req, res) => {
    console.log('Fetching history...');
    
    // Find the first existing history file
    const historyPath = HISTORY_PATHS.find(p => fs.existsSync(p));

    if (!historyPath) {
        console.error('No browser history file found.');
        return res.status(404).json({ error: "No browser history file found in common locations." });
    }

    try {
        // Copy file to avoid "locked" error
        fs.copyFileSync(historyPath, TEMP_HISTORY_PATH);

        const db = new sqlite3.Database(TEMP_HISTORY_PATH, (err) => {
            if (err) {
                return res.status(500).json({ error: "DB connection error: " + err.message });
            }
        });

        const query = `
            SELECT id, url, title, visit_count, last_visit_time
            FROM urls
            WHERE title != ''
            ORDER BY last_visit_time DESC
            LIMIT 250
        `;

        db.all(query, [], (err, rows) => {
            // Close DB first
            db.close((closeErr) => {
                if (closeErr) console.error('Error closing DB:', closeErr);
                
                // Try to clean up, but don't crash if it fails (Windows file locks)
                try {
                    if (fs.existsSync(TEMP_HISTORY_PATH)) {
                        fs.unlinkSync(TEMP_HISTORY_PATH);
                    }
                } catch (e) {
                    console.warn('Could not delete temp file (likely locked), will overwrite next time.');
                }
            });

            if (err) {
                console.error('Query error:', err);
                return res.status(500).json({ error: "Query failed: " + err.message });
            }
            
            const webkitToUnix = (webkitTimestamp) => {
                return Math.floor((webkitTimestamp / 1000000) - 11644473600);
            };

            const history = rows.map(row => ({
                id: row.id,
                url: row.url,
                title: row.title,
                visitCount: row.visit_count,
                lastVisitTime: webkitToUnix(row.last_visit_time),
                category: inferCategory(row.url, row.title)
            }));

            console.log(`Successfully fetched ${history.length} items.`);
            res.json(history);
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

function inferCategory(url, title) {
    const u = url.toLowerCase();
    const t = title.toLowerCase();
    
    // Coding & Development
    if (u.includes('github') || u.includes('stack') || u.includes('docs') || u.includes('npm') || u.includes('dev') || u.includes('localhost') || u.includes('vercel') || u.includes('gemini')) return 'Coding';
    
    // Video & Streaming
    if (u.includes('youtube') || u.includes('netflix') || u.includes('twitch') || u.includes('vimeo') || u.includes('video')) return 'Video';
    
    // Social & Communication
    if (u.includes('google') || u.includes('gmail') || u.includes('twitter') || u.includes('x.com') || u.includes('facebook') || u.includes('linkedin') || u.includes('reddit') || u.includes('instagram') || u.includes('discord') || u.includes('whatsapp') || u.includes('telegram') || u.includes('messenger') || u.includes('medium')) return 'Social';
    
    return 'Other';
}

const PORT = 3001;
const https = require('https');

app.get('/api/suggestions', (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    
    console.log(`Suggestion request for: "${query}"`);

    // Using client=firefox returns a cleaner [query, [suggestions]] format
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };

    https.get(url, options, (googleRes) => {
        let data = '';
        googleRes.on('data', (chunk) => { data += chunk; });
        googleRes.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const rawSuggestions = parsed[1] || [];
                
                const suggestions = rawSuggestions.map(text => ({
                    type: 'search',
                    text: text,
                    sub: 'Google Search',
                    icon: 'search'
                }));

                // Always add the verbatim search as first option if not present
                if (suggestions.length > 0 && suggestions[0].text.toLowerCase() !== query.toLowerCase()) {
                    suggestions.unshift({
                        type: 'search',
                        text: query,
                        sub: 'Google Search',
                        icon: 'search'
                    });
                } else if (suggestions.length === 0) {
                    suggestions.push({
                        type: 'search',
                        text: query,
                        sub: 'Google Search',
                        icon: 'search'
                    });
                }

                console.log(`  -> Found ${suggestions.length} suggestions`);
                res.json(suggestions.slice(0, 10));
            } catch (e) {
                console.error('  -> Parse error:', e);
                res.json([{ type: 'search', text: query, sub: 'Google Search', icon: 'search' }]);
            }
        });
    }).on('error', (err) => {
        console.error('  -> Fetch error:', err);
        res.json([{ type: 'search', text: query, sub: 'Google Search', icon: 'search' }]);
    });
});

app.listen(PORT, () => {
    console.log(`History server running on http://localhost:${PORT}`);
});
