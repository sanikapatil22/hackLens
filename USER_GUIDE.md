# HackerBuddy User Guide

Welcome! This guide shows you how to use every feature of HackerBuddy.

## Getting Started

1. Open the app at `http://localhost:3000`
2. You'll see 5 main tabs at the top:
   - 🌍 Analyze Website
   - ⚖️ Compare Sites
   - 📁 Upload HTML
   - ⚡ Hack or Safe
   - 📚 Learn Security

## Tab 1: Analyze Website

### What It Does
Analyzes any public website for security, performance, compliance, SEO, and accessibility issues.

### How to Use
1. Enter a website URL (e.g., `example.com` or `https://example.com`)
2. Click "Analyze Website"
3. Wait for the analysis to complete (shows "Analyzing..." message)
4. View your results

### Understanding Your Results

**Overall Risk Score**
- 0-25%: ✅ Good (minimal issues)
- 25-50%: ⚠️ Fair (some improvements needed)
- 50-75%: ⚠️ Concerning (multiple issues)
- 75-100%: 🔴 Critical (urgent attention needed)

**Category Filter**
- Click category buttons to filter findings:
  - **Security** (Red) - Hacking vulnerabilities
  - **Performance** (Orange) - Speed & efficiency
  - **Compliance** (Purple) - Legal & privacy
  - **SEO** (Blue) - Search visibility
  - **Accessibility** (Cyan) - Inclusivity

**Each Finding Shows**
- Title and severity badge
- 4-part explanation:
  - 🔍 What I Noticed
  - 😈 How I'd Attack This
  - 💥 What Could Happen
  - 🛠 How to Fix It

**Click to Expand**
When you click a finding, you see:
- Code examples (vulnerable vs. secure)
- Attack timeline (step-by-step how hackers exploit it)
- Hacker confidence meter (ease of exploitation)
- ELI5 explanation (simple version)
- Before/after comparison

## Tab 2: Compare Sites

### What It Does
Compare the security posture of two websites side-by-side.

### How to Use
1. Enter Website 1 URL
2. Enter Website 2 URL
3. Click "Compare Websites"
4. View detailed comparison

### Understanding Comparison Results

**Winner Badge**
- Shows which site is safer
- Displays the risk score difference
- Example: "45% safer than the other site"

**Side-by-Side Cards**
Each site shows:
- Risk score with color coding
- Critical issues count
- High severity issues count
- Medium severity issues count
- Low severity issues count
- Total issues

**When to Use This**
- Benchmark your site against competitors
- Evaluate hosting providers
- Choose between website platforms
- Track improvements over time

### Example Scenarios

**Scenario 1: Evaluating a New Platform**
- Analyze your current site
- Analyze the platform's demo site
- Compare side-by-side
- Identify gaps before migration

**Scenario 2: Competitive Analysis**
- Analyze your site
- Analyze a competitor's site
- See where you're stronger
- See where you need improvement

**Scenario 3: Before/After Verification**
- Analyze site before updates
- Make security fixes
- Analyze again
- Compare to see improvements

## Tab 3: Upload HTML

### What It Does
Analyze a local HTML file without sending it to a server.

### How to Use
1. Click "Upload HTML"
2. Drag-and-drop an .html file or select from your computer
3. File is analyzed instantly
4. View results (same as website analysis)

### What It Checks
- Inline scripts and event handlers
- Form security
- Missing CSRF protection
- Unescaped output
- Security headers
- Accessibility attributes

### Privacy Note
Your HTML is analyzed locally. No data is sent to external servers.

## Tab 4: Hack or Safe Quiz

### What It Does
Test your security knowledge with interactive challenges.

### How to Use
1. Read the scenario or code
2. Decide if it's SAFE or VULNERABLE
3. Click your answer
4. See the result immediately
5. Read the explanation
6. Get points for correct answers

### Difficulty Levels
- **Easy** (1 point) - Basic concepts
- **Medium** (3 points) - Real-world scenarios
- **Hard** (5 points) - Complex situations

### Your Score
- Tracks correct answers
- Accumulates points
- Shows difficulty of questions
- Stores session results

### Example Questions
- "Is this code vulnerable to SQL injection?"
- "Does this site properly validate user input?"
- "Is this HTTPS implementation secure?"
- "Does this follow accessibility best practices?"

## Tab 5: Learn Security

### What It Does
Educational examples showing all HackerBuddy features.

### How to Use
1. Browse pre-built findings
2. Each finding demonstrates features
3. Click findings to expand and explore
4. Study the explanations
5. Review code examples
6. Understand attack timelines

### What You'll Learn
- Common vulnerabilities
- How hackers exploit them
- How to fix each issue
- Best practices
- Real-world impact

## Understanding Key Features

### Attack Timeline
Shows step-by-step how hackers exploit a vulnerability.

Example for HTTPS bypass:
1. Connect to unsecured network
2. Use packet sniffer tool
3. Capture unencrypted traffic
4. Extract login credentials
5. Access user account

### Try Attack Sandbox
Safely test how attacks work.

Example SQL Injection:
- Input field: `' OR '1'='1`
- See: How the database interprets it
- Learn: Why this is dangerous
- Understand: How parameterized queries fix it

### Code Examples
Shows vulnerable vs. secure code.

**Vulnerable:**
```javascript
const query = "SELECT * FROM users WHERE id = " + userId;
```

**Secure:**
```javascript
const query = db.query("SELECT * FROM users WHERE id = ?", [userId]);
```

### Hacker Confidence Meter
0-100% showing:
- **Exploit Difficulty** - How hard is the attack?
- **Attack Vector** - Is it a common attack?
- **User Interaction** - Does the user need to click something?
- **Authentication** - Do you need to be logged in?
- **Success Rate** - What are the odds of success?

### Explain Like I'm 5
Click the toggle to see a simpler explanation.

**Regular:** "HTTPS uses TLS/SSL encryption with asymmetric cryptography..."

**ELI5:** "HTTPS is like sending a letter in a locked box. HTTP is like sending a postcard anyone can read."

### Before vs After
See the improvement from implementing fixes.

Shows:
- Vulnerable code
- Fixed code
- What specifically changed
- How the fix improves security
- Percentage reduction in risk

## Tips & Best Practices

### For Learning
1. Start with "Easy" quiz questions
2. Use "Learn Security" tab for examples
3. Read ELI5 explanations first
4. Study code examples
5. Graduate to "Hard" questions

### For Site Owners
1. Analyze your site regularly
2. Filter by one category at a time
3. Fix critical issues first
4. Compare before/after
5. Track improvements over time

### For Developers
1. Study code examples
2. Learn about attack timelines
3. Understand hacker perspective
4. Review best practices
5. Apply fixes to your code

### For Educators
1. Use quiz for student assessment
2. Share learning examples
3. Compare sites to teach analysis
4. Show before/after improvements
5. Discuss real-world implications

## Common Questions

**Q: Is this analysis comprehensive?**
A: No, this is educational analysis of basic security checks. Professional penetration testing requires much deeper analysis.

**Q: Can I analyze private sites?**
A: No, only public websites. For local sites, use the HTML upload feature.

**Q: How often should I analyze my site?**
A: After any significant changes, monthly for active sites, or when security practices evolve.

**Q: Are my results saved?**
A: No, results are temporary. Take screenshots if you want to keep them.

**Q: Can I export the results?**
A: Currently no export feature. Consider taking screenshots or writing notes.

**Q: Is it safe to analyze websites I don't own?**
A: Yes, analysis is read-only and passive. However, always get permission before testing sites you don't own.

**Q: What does "Hacker Confidence" mean?**
A: It's an estimate of how likely an exploit would succeed. Higher = easier to exploit.

## Troubleshooting

**"Could not reach this website"**
- Website might be offline
- Your internet connection might be down
- Website might be blocking analysis
- Try a different website

**"Analysis taking too long"**
- Website might be slow
- Your internet might be slow
- Try refreshing the page
- Try a simpler website

**Quiz not saving scores**
- Scores are stored in your browser session
- Refreshing the page resets scores
- Take a screenshot to save results

## Getting Help

1. Read this guide (you're doing it!)
2. Check the "Learn Security" tab
3. Study the code examples
4. Review the attack timelines
5. Take the quiz to test understanding

## What to Do With Results

**If You Find Issues**
1. Understand the issue (read the explanation)
2. See how it can be exploited (attack timeline)
3. Learn the fix (code example)
4. Implement the fix
5. Re-analyze to verify

**If You're Learning**
1. Study the explanation
2. Research the topic further
3. Practice with the quiz
4. Discuss with others
5. Review regularly

**If You're Teaching**
1. Show examples from "Learn" tab
2. Have students take the quiz
3. Discuss vulnerable code
4. Compare before/after
5. Assign real-world analysis

## Summary

HackerBuddy helps you:
- ✅ Understand website security
- ✅ Learn from real vulnerabilities
- ✅ Compare sites objectively
- ✅ Test your knowledge
- ✅ Improve your security posture

Start with the "Analyze Website" tab and explore from there!
