# Live Hacking Demo - Complete Guide

## Overview

The **Live Hacking Demo** feature allows users to see real-time interactive demonstrations of how vulnerabilities in their websites could be exploited. Users enter a URL, analyze it for vulnerabilities, then click "Try Live Demo" on any finding to see a step-by-step attack simulation.

## Features

### 1. URL-Based Analysis
- Users enter any website URL
- HackerBuddy analyzes it for vulnerabilities
- Analysis results show all discovered vulnerabilities

### 2. Live Demo Triggers
- Each vulnerability finding has a "Try Live Demo" button
- Clicking the button loads an interactive attack simulation specific to that vulnerability
- Demonstrations are tied to the actual analyzed URL

### 3. Interactive Attack Steps
- **Step-by-step visualization** showing how attackers would exploit the vulnerability
- **Clickable timeline** - users can jump to any step in the attack sequence
- **Detailed payload display** - shows the exact commands/data an attacker would use
- **Copy-to-clipboard** functionality for each payload

### 4. Attack Playground
- **Test payloads** - Pre-built, curated attack payloads users can copy and test
- **Form fields** - Interactive form showing which fields are vulnerable
- **Execute simulation** - Button to see a simulated attack execution
- **Real-time results** - Shows what data would be exposed

### 5. Visualization & Impact
- **Before/After comparison** - Shows vulnerable vs secure state
- **Attack surface** - Highlights what areas are at risk
- **Impact metrics** - Quantifies the danger (e.g., bandwidth usage, data exposure)

## Supported Vulnerabilities

Currently, the API simulates attacks for these vulnerabilities:

### 1. No HTTPS (no-https)
- **Attack**: Man-in-the-Middle on unencrypted HTTP
- **Demonstration**: WiFi network interception of login credentials
- **Playground**: Enter username/password to see plaintext transmission
- **Simulation**: Shows credentials being captured unencrypted

### 2. Missing Security Headers (missing-headers)
- **Attack**: Clickjacking via hidden iframes
- **Demonstration**: Attacker embeds your site in invisible frame
- **Playground**: Shows transfer forms being submitted in hidden frames
- **Simulation**: Demonstrates unintended actions (transfers, password changes)

### 3. Server Banner Disclosure (server-banner)
- **Attack**: Version enumeration leading to targeted exploits
- **Demonstration**: Attacker uses server info to find CVEs
- **Playground**: Shows how server version reveals exploitable vulnerabilities
- **Simulation**: Demonstrates RCE through version-specific exploits

### 4. Missing Content Compression (no-compression)
- **Attack**: Bandwidth exhaustion DoS
- **Demonstration**: Uncompressed responses enable large-scale attacks
- **Playground**: Shows impact of gzip compression
- **Simulation**: Calculates bandwidth waste and attack feasibility

## User Flow

### 1. Start Analysis
```
User enters URL → Click "Analyze" → Website analyzed
```

### 2. View Results
```
Analysis shows all findings (Security, Performance, Compliance, etc.)
Each finding card displays severity and category
```

### 3. Click Try Live Demo
```
User expands a finding → Sees "Try Live Demo" button
Clicks button → Live demo loads for that vulnerability
```

### 4. Explore Attack Simulation
```
Interactive timeline shows attack steps
User can click steps or read descriptions
View actual payloads used in attack
Copy payloads to test locally
```

### 5. Try Playground
```
Interactive form with vulnerable fields
Pre-built test payloads with descriptions
Execute button to see simulated attack
View "Attack Execution" results showing data exposure
```

### 6. Learn Impact
```
Before/After visualization
Shows secure vs vulnerable state
Highlights attack surface
Explains real-world impact
```

## Component Architecture

### API Endpoint
**`/api/simulate-attack`** (POST)

```javascript
POST /api/simulate-attack
Content-Type: application/json

{
  "vulnerabilityId": "no-https",
  "url": "https://example.com"
}
```

Returns complete attack simulation with steps, payloads, and visualizations.

### Components

1. **`live-url-demo.tsx`** - Main container
   - URL input form
   - Findings list selector
   - Delegates to simulator

2. **`vulnerability-simulator.tsx`** - Attack visualization
   - Interactive attack timeline
   - Step-by-step details
   - Payload display with copy buttons
   - Test playground with forms
   - Attack execution simulation
   - Before/After visualization

3. **`security-finding.tsx`** - Updated to include "Try Demo" button
   - Passes URL and handler up
   - Triggers demo modal

4. **`analysis-result.tsx`** - Updated to show demo when clicked
   - Manages demo state
   - Switches between findings list and simulator view

5. **`tabs-navigation.tsx`** - Updated with "Live Hacking Demo" tab
   - New navigation option
   - Standalone demo entry point

## How to Use

### Method 1: From Analysis Results
1. Go to "Analyze Website" tab
2. Enter any URL and click "Analyze"
3. Find a vulnerability you want to understand
4. Click "Try Live Demo" button
5. Explore the interactive attack simulation

### Method 2: From Live Demo Tab
1. Go to "Live Hacking Demo" tab
2. Enter a URL
3. Click "Analyze" to scan it
4. Select a vulnerability from the list
5. See the attack simulation

### Method 3: Direct Link
- Users can bookmark the "Live Hacking Demo" tab for quick access

## Example Payloads

### HTTP Interception (no-https)
```
username=admin@example.com
password=securePassword123
```
Shows plaintext transmission over unencrypted connection.

### Server Banner Enumeration (server-banner)
```
curl -i https://example.com | grep Server
```
Reveals: `Server: Apache/2.4.1`

### Bandwidth Attack (no-compression)
```
1MB uncompressed × 10,000 requests = 10GB data transfer
1MB compressed (gzip) × 10,000 requests = 2GB total (80% savings)
```

## Educational Benefits

1. **Real-world context** - Demonstrations tied to actual URLs, not generic examples
2. **Step-by-step learning** - Users see exactly how attacks progress
3. **Interactive exploration** - Not passive reading, but active testing
4. **Copy-paste payloads** - Can test locally (in safe environment)
5. **Visual impact** - Before/After shows why fixes matter
6. **Multi-perspective** - Hacker view, user impact, defense strategies

## Security Notes

- All demonstrations are **educational simulations** only
- No actual attacks are executed against user sites
- Payloads shown are **generic examples**, not actual exploit code
- System is safe for learning in controlled environments
- Intended to help users understand vulnerabilities, not to facilitate hacking

## Future Enhancements

Potential additions to expand coverage:

1. **SQL Injection** - Form input testing with database simulation
2. **XSS Attacks** - JavaScript injection demonstrations
3. **CSRF** - Cross-site request forgery wallet/form examples
4. **Path Traversal** - File system access simulations
5. **API Vulnerabilities** - REST API exploitation examples
6. **Authentication Bypass** - Password/session manipulation
7. **Insecure Deserialization** - Object injection examples
8. **XML/Entity Injection** - XML bomb demonstrations

## API Response Example

```json
{
  "success": true,
  "simulation": {
    "vulnerabilityId": "no-https",
    "vulnerabilityType": "Missing HTTPS Encryption",
    "url": "https://example.com",
    "demonstration": {
      "title": "Man-in-the-Middle Attack on Unencrypted HTTP",
      "scenario": "An attacker on the same WiFi network intercepts login credentials...",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Attacker connects to same WiFi network as victim",
          "result": "Network traffic becomes visible to attacker",
          "impact": "All unencrypted data can be captured"
        },
        ...
      ]
    },
    "attackPlayground": {
      "formFields": [
        {
          "name": "username",
          "type": "text",
          "placeholder": "Enter username",
          "vulnerable": true
        }
      ],
      "testPayloads": [
        {
          "name": "Normal Login",
          "payload": "username=admin&password=mypassword",
          "description": "Regular login credentials sent in plaintext"
        }
      ]
    },
    "visualization": {
      "before": "HTTP://example.com (Plaintext) → ...",
      "after": "HTTPS://example.com (Encrypted) → ...",
      "attackSurface": "Every user login, API call, and form submission"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Troubleshooting

### Demo not loading
- Ensure the URL was analyzed successfully first
- Check that the vulnerability ID is correct
- Verify the API endpoint is accessible

### Payloads not copying
- Check browser clipboard permissions
- Try copying from different fields
- Ensure JavaScript is enabled

### Simulation not executing
- Click the "Execute Attack Simulation" button
- Ensure form fields are visible
- Check browser console for errors

## Files Modified/Created

### New Files
- `/app/api/simulate-attack/route.ts` - API endpoint (350 lines)
- `/components/vulnerability-simulator.tsx` - Simulator component (266 lines)
- `/components/live-url-demo.tsx` - Main container (231 lines)

### Modified Files
- `/components/security-finding.tsx` - Added "Try Live Demo" button
- `/components/analysis-result.tsx` - Added demo modal
- `/components/tabs-navigation.tsx` - Added "Live Hacking Demo" tab
- `/app/page.tsx` - Added live demo tab state and handler

## Statistics

- **4 Vulnerability Types** currently supported
- **4 Steps** per vulnerability demonstration
- **2+ Payloads** per vulnerability type
- **3 Visualization Modes** (timeline, form, before/after)
- **100% Educational** - Safe to use for learning
