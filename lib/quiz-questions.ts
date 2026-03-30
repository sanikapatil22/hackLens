import { QuizQuestion } from '@/types/security';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    difficulty: 'easy',
    scenario: 'You see a login form that sends passwords in plain text over HTTP.',
    code: undefined,
    options: [
      { label: 'SAFE - it works fine', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - data can be intercepted', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'Without HTTPS, all data sent over HTTP is visible to anyone on the network. A hacker could intercept passwords, credit cards, or any sensitive data.',
    hackerTip: 'A hacker on the same WiFi could use tools like Wireshark to capture passwords in seconds.',
    pointsReward: 10,
  },
  {
    id: 'q2',
    difficulty: 'easy',
    scenario: 'A website displays user comments without any filtering or escaping.',
    code: `<div id="comments">
  {userComment}
</div>`,
    options: [
      { label: 'SAFE - comments are just text', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - XSS attack possible', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'If a user submits HTML/JavaScript as a comment, it will execute in other users\' browsers. A hacker could steal cookies, sessions, or perform actions as the victim.',
    hackerTip: 'A simple payload like <script>alert("hacked")</script> would pop up for every user viewing that comment.',
    pointsReward: 10,
  },
  {
    id: 'q3',
    difficulty: 'medium',
    scenario: 'A search form uses user input directly in a database query.',
    code: `const query = "SELECT * FROM users WHERE name = '" + userInput + "'";
db.execute(query);`,
    options: [
      { label: 'SAFE - the database validates it', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - SQL injection possible', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'A hacker can insert SQL commands into the user input. For example: search for "\' OR \'1\'=\'1" to return all users. They could delete data, steal everything, or modify records.',
    hackerTip: 'Classic payload: " OR "1"="1 - this makes the query always true, bypassing authentication.',
    pointsReward: 20,
  },
  {
    id: 'q4',
    difficulty: 'medium',
    scenario: 'A file upload feature accepts any file type with no validation.',
    code: `if (file) {
  saveFile(file);
}`,
    options: [
      { label: 'SAFE - the server handles it', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - arbitrary file upload', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'A hacker could upload executable files, scripts, or backdoors. They could execute code on your server or host malware. Always validate file types and store files outside the web root.',
    hackerTip: 'Upload a .php or .exe file and potentially execute it. Or upload a malicious .pdf that exploits PDF reader vulnerabilities.',
    pointsReward: 20,
  },
  {
    id: 'q5',
    difficulty: 'medium',
    scenario: 'User IDs are sequential numbers (1, 2, 3...) visible in URLs.',
    code: `example.com/profile/123
example.com/invoice/456`,
    options: [
      { label: 'SAFE - user IDs are public anyway', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - enumeration/IDOR attack', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'A hacker can guess other users\' IDs by incrementing the number. Without proper authorization checks, they can access private profiles, invoices, and data. This is called IDOR (Insecure Direct Object Reference).',
    hackerTip: 'Simply change the ID in the URL: /profile/999 - if not properly secured, you see another user\'s private data.',
    pointsReward: 20,
  },
  {
    id: 'q6',
    difficulty: 'hard',
    scenario: 'An API endpoint validates JWT tokens but doesn\'t verify the signature.',
    code: `const decoded = jwt.decode(token);
// No jwt.verify() call!
if (decoded.userId) {
  accessAllowed = true;
}`,
    options: [
      { label: 'SAFE - JWT is verified', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - token can be forged', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'Decoding without verification means a hacker can create their own token with any user ID. Always call verify() with the secret key. Without it, anyone can impersonate any user.',
    hackerTip: 'A hacker can use jwt.io to create a fake token, changing their userId to any value, and the server will accept it.',
    pointsReward: 30,
  },
  {
    id: 'q7',
    difficulty: 'hard',
    scenario: 'A password reset email contains a token that never expires.',
    code: `const resetToken = generateToken(); // No expiration set
sendEmail(user.email, resetToken);`,
    options: [
      { label: 'SAFE - tokens are encrypted', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - indefinite token lifetime', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'If a hacker intercepts the email (or finds it in logs), they can use the token forever. Always set expiration times (e.g., 15 minutes). Consider adding additional verification like CAPTCHA.',
    hackerTip: 'If a user accidentally forwards the reset email or the email server is breached, a hacker has permanent access to reset that account.',
    pointsReward: 30,
  },
  {
    id: 'q8',
    difficulty: 'hard',
    scenario: 'Server errors display full stack traces and database connection strings to users.',
    code: `try {
  query();
} catch (error) {
  res.send(error.toString()); // Shows full error to user
}`,
    options: [
      { label: 'SAFE - helps with debugging', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - information disclosure', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'Error messages reveal system internals: database software, file paths, and technologies used. This helps hackers plan targeted attacks. Always show generic errors to users and log detailed errors server-side.',
    hackerTip: 'Stack traces reveal database versions, library versions, and exact code paths - a goldmine for finding known vulnerabilities.',
    pointsReward: 30,
  },
  {
    id: 'q9',
    difficulty: 'easy',
    scenario: 'A website checks if a user is admin with: if (user.role === "admin")',
    code: undefined,
    options: [
      { label: 'SAFE - role is from the server', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - role can be tampered with', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'If user.role comes from client-side data (JWT, localStorage), a hacker can modify it. Always verify roles server-side against the database. Never trust client data for authorization.',
    hackerTip: 'Modify the JWT or localStorage to change role to "admin", and if the server doesn\'t re-verify, instant admin access.',
    pointsReward: 15,
  },
  {
    id: 'q10',
    difficulty: 'medium',
    scenario: 'API key is hardcoded in frontend JavaScript.',
    code: `const API_KEY = "sk-1234567890abcdef";
fetch("/api/data", {
  headers: { Authorization: \`Bearer \${API_KEY}\` }
})`,
    options: [
      { label: 'SAFE - no one looks at code', value: 'safe', isCorrect: false },
      { label: 'VULNERABLE - keys are exposed', value: 'vulnerable', isCorrect: true },
    ],
    explanation: 'Anyone can view your frontend code and find the API key. A hacker can use it to make unlimited requests, impersonate your app, or access restricted data. Always use environment variables and server-side proxies.',
    hackerTip: 'Open DevTools, search for "sk-" or "API", and find exposed credentials in minutes.',
    pointsReward: 15,
  },
];
