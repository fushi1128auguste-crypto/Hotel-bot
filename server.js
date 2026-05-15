const http = require("http");
const https = require("https");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const PORT = process.env.PORT || 3000;

const HOTEL_KNOWLEDGE = `
You are a friendly AI concierge for My Place Guesthouse in Naha, Okinawa, Japan — powered by NiteBot.

PROPERTY INFORMATION:
- Name: My Place Guesthouse
- Address: Seasir Tomari Building, 3-1-8 Tomari, Naha, Okinawa 900-0012
- Phone: +81 80-8569-2887
- Email: myplace-okinawa@seasir.com
- Website: myplace-guesthouse.com
- Front desk hours: 8:00 AM – 10:00 PM
- If arriving after 10:00 PM: Please contact the property in advance

CHECK-IN / CHECK-OUT:
- Check-in: Flexible — contact property in advance for exact time
- Check-out: Please confirm with front desk
- Early check-in and late check-out available on request

LOCATION:
- 1 minute walk from Tomari Port (North pier of Tomari Ferry Terminal)
- 15 minutes walk from Miebashi Station (Yui Rail monorail)
- 20 minutes by car from Naha Airport
- Route 58 (main national road) is just steps away

GETTING HERE:
- From Naha Airport: ~20 min by car or taxi
- By monorail: Yui Rail to Miebashi Station, then 15 min walk
- From Tomari Port: 1 min walk

NEARBY:
- Tomari Iyumachi Fish Market: 5 min walk
- Naminoue Beach: short walk
- Kokusai Dori (International Street): 20 min walk
- Kerama Islands boat departure: right next to the property (Zamami, Tokashiki, Aka islands)

AMENITIES:
- Free WiFi throughout the property
- Free private parking (limited spaces, first-come first-served — nearby public parking also available)
- Fully equipped shared kitchen (available 24 hours)
- Spacious shared lounge with hammocks
- Cafe and bar on site (Happy Hour available — ask staff for details)
- Bike rental available
- Laundry facilities
- Coworking space (free for guests — WiFi and AC available)
- Tour desk: discounted activities including snorkeling, diving, parasailing, fishing, bus tours
- Baggage storage available (fees apply)

ROOMS:
- Dormitory rooms: bunk beds with privacy curtain, reading light, electrical socket
- Some rooms have harbor view
- Private rooms available (including Deluxe Twin with two semi-double beds, sofa, hotel amenities)
- 4-bed private rooms for groups

ACTIVITIES (via tour desk):
- Snorkeling, diving, parasailing, fishing, bus tours — all at discounted prices for guests
- Bike rental to explore the area
- Snorkeling equipment rental available

LANGUAGES STAFF SPEAK:
- English: Full-time
- Chinese: Full-time
- French: Part-time
- Taiwanese / Cantonese: Part-time

HOUSE RULES:
- Please remove shoes at entrance
- Be respectful of other guests in shared spaces
- Contact front desk in advance if arriving after 10:00 PM

LANGUAGE RULE — CRITICAL:
Detect the language the guest is writing in and ALWAYS reply in that exact same language.
English → reply in English
Japanese → reply in Japanese (日本語)
Korean → reply in Korean (한국어)
Chinese → reply in Chinese (中文)

STYLE: Warm, friendly, and concise. Short paragraphs easy to read on a phone. Feel like a helpful local friend, not a robot. Always make the guest feel welcome.
If you don't know something specific, say: "Please ask our staff directly — we're always happy to help!"
Never make up information not listed above.
`;

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NiteBot — AI Hotel Concierge</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --navy:    #06080f;
    --navy2:   #0a1120;
    --navy3:   #111827;
    --cyan:    #00d4ff;
    --cyan-dim: rgba(0,212,255,0.15);
    --cyan-glow: rgba(0,212,255,0.08);
    --white:   #ffffff;
    --muted:   rgba(255,255,255,0.45);
    --border:  rgba(0,212,255,0.12);
    --bubble-bot: rgba(255,255,255,0.06);
    --bubble-user: linear-gradient(135deg, #0099cc, #00d4ff);
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: radial-gradient(ellipse at 30% 20%, #0a1f3d 0%, #06080f 55%, #000510 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
  }

  /* Stars background */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 8%  12%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(1px 1px at 18% 35%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 28% 65%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 18%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 52% 8%,  rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(1px 1px at 63% 42%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 72% 22%, rgba(255,255,255,0.65) 0%, transparent 100%),
      radial-gradient(1px 1px at 80% 70%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 88% 14%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 93% 55%, rgba(255,255,255,0.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 15% 78%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 35% 88%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 58% 80%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 76% 90%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(2px 2px at 45% 50%, rgba(0,212,255,0.12) 0%, transparent 100%),
      radial-gradient(2px 2px at 22% 22%, rgba(0,212,255,0.08) 0%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  .chat-container {
    width: 100%;
    max-width: 420px;
    background: var(--navy2);
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(0,212,255,0.18);
    box-shadow:
      0 0 0 1px rgba(0,212,255,0.07),
      0 24px 60px rgba(0,0,0,0.7),
      0 0 60px rgba(0,212,255,0.10),
      0 0 120px rgba(0,212,255,0.04);
    display: flex;
    flex-direction: column;
    height: 620px;
    position: relative;
    z-index: 1;
  }

  /* Header */
  .chat-header {
    background: linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 11px;
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .chat-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--cyan), transparent);
    opacity: 0.3;
  }

  /* NiteBot icon in header */
  .header-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    position: relative;
  }

  .header-icon svg {
    width: 100%;
    height: 100%;
  }

  .header-info { flex: 1; }

  .header-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--white);
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .header-name .brand-nite { color: var(--white); }
  .header-name .brand-bot  { color: var(--cyan); }

  .header-sub {
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px;
  }

  .online-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: var(--muted);
  }

  .online-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74,222,128,0.6);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Messages */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .message {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    animation: fadeUp 0.25s ease;
  }

  .msg-content {
    display: flex;
    flex-direction: column;
    max-width: 80%;
  }

  .message.user .msg-content { align-items: flex-end; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .message.user { flex-direction: row-reverse; }

  .msg-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
  }

  .message.bot .msg-avatar {
    background: linear-gradient(135deg, #003d55, #005f80);
    border: 1px solid rgba(0,212,255,0.4);
    color: var(--cyan);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .message.user .msg-avatar {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--muted);
    font-size: 10px;
  }

  .msg-time {
    font-size: 9px;
    color: rgba(255,255,255,0.2);
    margin-top: 4px;
    padding: 0 4px;
    align-self: flex-end;
  }

  .message.user .msg-time { text-align: right; }

  .bubble {
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .message.bot .bubble {
    background: var(--bubble-bot);
    border: 1px solid var(--border);
    color: rgba(255,255,255,0.88);
    border-radius: 14px 14px 14px 3px;
  }

  .message.user .bubble {
    background: var(--bubble-user);
    color: var(--navy);
    font-weight: 500;
    border-radius: 14px 14px 3px 14px;
    border: none;
  }

  .msg-content .bubble { max-width: 100%; }

  /* Typing */
  .typing .bubble {
    background: var(--bubble-bot);
    border: 1px solid var(--border);
    border-radius: 14px 14px 14px 3px;
    padding: 13px 16px;
  }

  .typing-dots { display: flex; gap: 5px; align-items: center; }
  .typing-dots span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    opacity: 0.6;
    animation: bounce 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%,60%,100% { transform: translateY(0); opacity: 0.6; }
    30% { transform: translateY(-5px); opacity: 1; }
  }

  /* Quick replies */
  .quick-replies {
    padding: 8px 12px;
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    border-top: 1px solid var(--border);
    background: var(--navy2);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .quick-replies::-webkit-scrollbar { display: none; }

  .quick-reply {
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    padding: 5px 12px;
    border-radius: 20px;
    background: transparent;
    border: 1px solid rgba(0,212,255,0.25);
    color: var(--cyan);
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.01em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .quick-reply:hover {
    background: var(--cyan-dim);
    border-color: var(--cyan);
  }

  /* Input */
  .input-area {
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--navy2);
  }

  .input-area input {
    flex: 1;
    padding: 9px 14px;
    border: 1px solid var(--border);
    border-radius: 24px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    outline: none;
    background: rgba(255,255,255,0.04);
    color: var(--white);
    transition: border-color 0.2s;
  }

  .input-area input::placeholder { color: var(--muted); }
  .input-area input:focus { border-color: rgba(0,212,255,0.4); background: rgba(0,212,255,0.04); }

  .send-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0099cc, #00d4ff);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    box-shadow: 0 0 12px rgba(0,212,255,0.3);
  }

  .send-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 0 18px rgba(0,212,255,0.5);
  }

  .send-btn svg {
    width: 16px; height: 16px;
    fill: var(--navy);
  }

  /* Powered by footer */
  .powered-by {
    text-align: center;
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    padding: 6px;
    border-top: 1px solid var(--border);
    letter-spacing: 0.08em;
    background: var(--navy2);
  }

  .powered-by span { color: var(--cyan); opacity: 0.5; }
</style>
</head>
<body>
<div class="chat-container">

  <!-- Header -->
  <div class="chat-header">
    <div class="header-icon">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Building -->
        <rect x="6" y="16" width="20" height="22" rx="1" stroke="#00d4ff" stroke-width="1.2" fill="rgba(0,212,255,0.05)"/>
        <!-- Roof block -->
        <rect x="9" y="12" width="14" height="5" rx="1" stroke="#00d4ff" stroke-width="1" fill="none" opacity="0.6"/>
        <!-- Flag pole -->
        <line x1="16" y1="12" x2="16" y2="7" stroke="#00d4ff" stroke-width="1.2" opacity="0.7"/>
        <polygon points="16,7 21,9 16,11" fill="#00d4ff" opacity="0.8"/>
        <!-- Windows lit -->
        <rect x="9"  y="20" width="4" height="4" rx="0.5" fill="#00d4ff" opacity="0.9"/>
        <rect x="15" y="20" width="4" height="4" rx="0.5" fill="#00d4ff" opacity="0.4"/>
        <rect x="21" y="20" width="4" height="4" rx="0.5" fill="#00d4ff" opacity="0.9"/>
        <rect x="9"  y="27" width="4" height="4" rx="0.5" fill="#00d4ff" opacity="0.4"/>
        <rect x="15" y="27" width="4" height="4" rx="0.5" fill="#00d4ff" opacity="0.9"/>
        <rect x="21" y="27" width="4" height="4" rx="0.5" fill="#00d4ff" opacity="0.4"/>
        <!-- Door -->
        <rect x="13" y="33" width="6" height="5" rx="0.5" stroke="#00d4ff" stroke-width="0.8" fill="none" opacity="0.5"/>
        <!-- Speech bubble -->
        <rect x="22" y="4" width="14" height="12" rx="3" fill="#00d4ff"/>
        <path d="M25 16 L23 21 L30 16 Z" fill="#00d4ff"/>
        <!-- Bot face -->
        <rect x="23.5" y="5.5" width="11" height="9" rx="2" fill="#06080f"/>
        <rect x="25"   y="7.5" width="3" height="2.5" rx="0.8" fill="#00d4ff"/>
        <rect x="30"   y="7.5" width="3" height="2.5" rx="0.8" fill="#00d4ff"/>
        <path d="M26 12 Q29 14 32 12" stroke="#00d4ff" stroke-width="0.8" stroke-linecap="round" fill="none"/>
        <!-- Antenna -->
        <line x1="29" y1="5.5" x2="29" y2="3" stroke="#06080f" stroke-width="1.2"/>
        <circle cx="29" cy="2.5" r="1" fill="#06080f"/>
      </svg>
    </div>
    <div class="header-info">
      <div class="header-name">
        <span class="brand-nite">Nite</span><span class="brand-bot">Bot</span>
      </div>
      <div class="header-sub">AI Hotel Concierge · AIコンシェルジュ</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
      <div class="online-indicator">
        <div class="online-dot"></div>
      </div>
      <div style="font-size:9px;color:rgba(0,212,255,0.5);letter-spacing:0.05em;">EN · 日 · 한 · 中</div>
    </div>
  </div>

  <!-- Messages -->
  <div class="messages" id="messages">
    <div class="message bot">
      <div class="msg-avatar">NB</div>
      <div class="msg-content">
        <div class="bubble">Welcome to Okinawa Guesthouse! 🌺
I'm your NiteBot concierge, available 24/7. Ask me anything about check-in, WiFi, directions, nearby restaurants, or house rules.
Feel free to ask in English, 日本語, 한국어, or 中文!</div>
        <div class="msg-time">Just now</div>
      </div>
    </div>
  </div>

  <!-- Quick replies -->
  <div class="quick-replies">
    <button class="quick-reply" onclick="sendQuick('What time is check-in?')">Check-in time?</button>
    <button class="quick-reply" onclick="sendQuick('What is the WiFi password?')">WiFi password?</button>
    <button class="quick-reply" onclick="sendQuick('Any restaurants nearby?')">Nearby food?</button>
    <button class="quick-reply" onclick="sendQuick('How do I get from the airport?')">From airport?</button>
    <button class="quick-reply" onclick="sendQuick('What are the house rules?')">House rules?</button>
  </div>

  <!-- Input -->
  <div class="input-area">
    <input type="text" id="input" placeholder="Ask about check-in, WiFi, local tips..." onkeydown="if(event.key==='Enter')sendMessage()" />
    <button class="send-btn" onclick="sendMessage()">
      <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
    </button>
  </div>

  <!-- Powered by -->
  <div class="powered-by">Powered by <span>NiteBot</span> · AI Hotel Concierge Platform</div>

</div>

<script>
  const messages = [];

  async function sendMessage() {
    const input = document.getElementById('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');
    messages.push({ role: 'user', content: text });
    showTyping();
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      removeTyping();
      const reply = data.reply || 'Sorry, something went wrong. Please try again.';
      addMessage(reply, 'bot');
      messages.push({ role: 'assistant', content: reply });
    } catch (e) {
      removeTyping();
      addMessage('Sorry, I am having trouble connecting. Please try again shortly.', 'bot');
    }
  }

  function sendQuick(text) {
    document.getElementById('input').value = text;
    sendMessage();
  }

  function getTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(text, role) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message ' + role;
    const avatarContent = role === 'bot' ? 'NB' : 'You';
    div.innerHTML =
      '<div class="msg-avatar">' + avatarContent + '</div>' +
      '<div class="msg-content">' +
        '<div class="bubble">' + text.replace(/</g, '&lt;').replace(/\\n/g, '<br>') + '</div>' +
        '<div class="msg-time">' + getTime() + '</div>' +
      '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message bot typing';
    div.id = 'typing';
    div.innerHTML =
      '<div class="msg-avatar">NB</div>' +
      '<div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
  }
</script>
</body>
</html>`;

function callOpenAI(messages, callback) {
  const body = JSON.stringify({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [
      { role: "system", content: HOTEL_KNOWLEDGE },
      ...messages
    ]
  });
  const options = {
    hostname: "api.openai.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENAI_API_KEY,
      "Content-Length": Buffer.byteLength(body)
    }
  };
  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        const reply = parsed.choices[0].message.content;
        callback(null, reply);
      } catch (e) {
        callback("Parse error");
      }
    });
  });
  req.on("error", (e) => callback(e.message));
  req.write(body);
  req.end();
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_PAGE);
    return;
  }
  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { messages } = JSON.parse(body);
        callOpenAI(messages, (err, reply) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ reply: "Sorry, I am having trouble. Please try again." }));
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ reply }));
          }
        });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply: "Bad request" }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("NiteBot running on port " + PORT);
});
