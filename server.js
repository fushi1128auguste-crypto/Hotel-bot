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
        <div class="bubble">Welcome to My Place Guesthouse! 🌺
I'm your NiteBot concierge, available 24/7. Ask me anything about check-in, WiFi, directions, nearby restaurants, or activities.
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

const DEMO_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Place Guesthouse — Tomari, Okinawa</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --sand: #f5f0e8;
    --ocean: #1a6b8a;
    --ocean-dark: #0f4a62;
    --coral: #e8694a;
    --text: #2c2c2c;
    --muted: #6b6b6b;
  }
  body { font-family: 'Inter', sans-serif; background: var(--sand); color: var(--text); }

  /* NAV */
  nav {
    background: white;
    padding: 16px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    position: sticky; top: 0; z-index: 100;
  }
  .nav-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--ocean-dark); }
  .nav-logo span { color: var(--coral); }
  .nav-links { display: flex; gap: 28px; list-style: none; }
  .nav-links a { text-decoration: none; color: var(--muted); font-size: 14px; font-weight: 500; transition: color 0.2s; }
  .nav-links a:hover { color: var(--ocean); }
  .nav-cta {
    background: var(--ocean);
    color: white;
    padding: 9px 20px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  }
  .nav-cta:hover { background: var(--ocean-dark); }

  /* HERO */
  .hero {
    height: 520px;
    background:
      linear-gradient(to bottom, rgba(15,74,98,0.55) 0%, rgba(15,74,98,0.3) 60%, rgba(245,240,232,0.1) 100%),
      radial-gradient(ellipse at 70% 40%, #1a8fa8 0%, #0f6b8a 30%, #063a52 70%, #021e2e 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      radial-gradient(2px 2px at 15% 25%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(2px 2px at 35% 15%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 60% 30%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(2px 2px at 80% 20%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(3px 3px at 50% 60%, rgba(255,255,255,0.15) 0%, transparent 100%),
      radial-gradient(2px 2px at 25% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
      radial-gradient(60px 20px at 30% 75%, rgba(255,255,255,0.06) 0%, transparent 100%),
      radial-gradient(80px 25px at 65% 80%, rgba(255,255,255,0.05) 0%, transparent 100%);
    pointer-events: none;
  }
  .hero-badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    font-size: 12px;
    letter-spacing: 0.12em;
    padding: 5px 14px;
    border-radius: 20px;
    margin-bottom: 16px;
    backdrop-filter: blur(4px);
  }
  .hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: 48px;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.3);
  }
  .hero p {
    font-size: 17px;
    color: rgba(255,255,255,0.85);
    margin-bottom: 28px;
    max-width: 480px;
    line-height: 1.6;
  }
  .hero-btns { display: flex; gap: 12px; }
  .btn-primary {
    background: var(--coral);
    color: white;
    padding: 13px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(232,105,74,0.4);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,105,74,0.5); }
  .btn-secondary {
    background: rgba(255,255,255,0.15);
    color: white;
    padding: 13px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 15px;
    border: 1px solid rgba(255,255,255,0.4);
    backdrop-filter: blur(4px);
    transition: all 0.2s;
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.25); }

  /* FEATURES BAR */
  .features-bar {
    background: var(--ocean-dark);
    display: flex;
    justify-content: center;
    gap: 48px;
    padding: 18px 40px;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.85);
    font-size: 13px;
    font-weight: 500;
  }
  .feature-icon { font-size: 16px; }

  /* SECTIONS */
  .section { padding: 64px 40px; max-width: 1100px; margin: 0 auto; }
  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--ocean-dark);
    margin-bottom: 8px;
  }
  .section-sub { color: var(--muted); font-size: 15px; margin-bottom: 36px; }

  /* ROOMS GRID */
  .rooms-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .room-card {
    background: white;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .room-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  .room-img {
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
  }
  .room-img.dorm { background: linear-gradient(135deg, #1a6b8a, #0f4a62); }
  .room-img.private { background: linear-gradient(135deg, #2d8a6b, #1a5a45); }
  .room-img.deluxe { background: linear-gradient(135deg, #8a4a1a, #5a2d0a); }
  .room-body { padding: 16px; }
  .room-name { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
  .room-desc { font-size: 13px; color: var(--muted); margin-bottom: 12px; line-height: 1.5; }
  .room-price { font-size: 14px; font-weight: 600; color: var(--coral); }

  /* AMENITIES */
  .amenities-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .amenity {
    background: white;
    border-radius: 12px;
    padding: 20px 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .amenity-icon { font-size: 28px; margin-bottom: 8px; }
  .amenity-name { font-size: 13px; font-weight: 500; color: var(--text); }

  /* LOCATION */
  .location-section { background: white; padding: 64px 40px; }
  .location-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
  .map-placeholder {
    height: 280px;
    background: linear-gradient(135deg, #d4e8f0, #a8d4e8);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .location-info h3 { font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 16px; color: var(--ocean-dark); }
  .location-list { list-style: none; }
  .location-list li { padding: 8px 0; font-size: 14px; color: var(--muted); border-bottom: 1px solid #f0f0f0; display: flex; gap: 10px; }
  .location-list li:last-child { border-bottom: none; }

  /* FOOTER */
  footer {
    background: var(--ocean-dark);
    color: rgba(255,255,255,0.7);
    text-align: center;
    padding: 32px 40px;
    font-size: 13px;
    line-height: 1.8;
  }
  footer strong { color: white; }

  /* NITEBOT WIDGET */
  .chat-fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 1000;
  }
  .chat-bubble-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0099cc, #00d4ff);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0,212,255,0.45);
    transition: all 0.3s;
    font-size: 11px;
    font-weight: 700;
    color: #06080f;
    letter-spacing: 0.03em;
    font-family: 'Inter', sans-serif;
  }
  .chat-bubble-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,212,255,0.6); }
  .chat-pulse {
    position: absolute;
    top: -3px; right: -3px;
    width: 14px; height: 14px;
    background: #4ade80;
    border-radius: 50%;
    border: 2px solid white;
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.1)} }
  .chat-tooltip {
    position: absolute;
    bottom: 70px;
    right: 0;
    background: #0a1628;
    color: white;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
    white-space: nowrap;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    border: 1px solid rgba(0,212,255,0.2);
    animation: fadeIn 0.3s ease;
  }
  .chat-tooltip::after {
    content: '';
    position: absolute;
    bottom: -6px; right: 22px;
    width: 12px; height: 12px;
    background: #0a1628;
    border-right: 1px solid rgba(0,212,255,0.2);
    border-bottom: 1px solid rgba(0,212,255,0.2);
    transform: rotate(45deg);
  }
  .chat-panel {
    position: fixed;
    bottom: 100px;
    right: 28px;
    width: 380px;
    height: 580px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 60px rgba(0,212,255,0.12);
    display: none;
    z-index: 999;
    animation: slideUp 0.3s ease;
    border: 1px solid rgba(0,212,255,0.2);
  }
  .chat-panel iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-logo">My Place <span>Guesthouse</span></div>
  <ul class="nav-links">
    <li><a href="#">Rooms</a></li>
    <li><a href="#">Activities</a></li>
    <li><a href="#">Location</a></li>
    <li><a href="#">Gallery</a></li>
  </ul>
  <a href="#" class="nav-cta">Book Now</a>
</nav>

<!-- HERO -->
<div class="hero">
  <div class="hero-badge">⭐ 4.8 · Tomari, Naha, Okinawa</div>
  <h1>Your Home in Okinawa</h1>
  <p>Steps from Tomari Port and the Kerama Islands ferry. The perfect base for exploring Okinawa.</p>
  <div class="hero-btns">
    <a href="#" class="btn-primary">Check Availability</a>
    <a href="#" class="btn-secondary">Take a Tour</a>
  </div>
</div>

<!-- FEATURES BAR -->
<div class="features-bar">
  <div class="feature-item"><span class="feature-icon">🛥️</span> 1 min from Kerama Ferry</div>
  <div class="feature-item"><span class="feature-icon">🌐</span> 4 languages spoken</div>
  <div class="feature-item"><span class="feature-icon">🅿️</span> Free private parking</div>
  <div class="feature-item"><span class="feature-icon">🍳</span> Shared kitchen 24h</div>
  <div class="feature-item"><span class="feature-icon">🤿</span> Dive & tour desk</div>
</div>

<!-- ROOMS -->
<div class="section">
  <div class="section-title">Rooms & Dormitories</div>
  <div class="section-sub">Whether you're a solo traveler or a group — we have you covered.</div>
  <div class="rooms-grid">
    <div class="room-card">
      <div class="room-img dorm">🛏️</div>
      <div class="room-body">
        <div class="room-name">Dormitory Bunk</div>
        <div class="room-desc">Bunk beds with privacy curtains, reading light, and personal power socket. Harbor view available.</div>
        <div class="room-price">From ¥3,500 / night</div>
      </div>
    </div>
    <div class="room-card">
      <div class="room-img private">🏠</div>
      <div class="room-body">
        <div class="room-name">Private Room</div>
        <div class="room-desc">Your own space with en-suite or shared bathroom. Ideal for couples and families.</div>
        <div class="room-price">From ¥8,500 / night</div>
      </div>
    </div>
    <div class="room-card">
      <div class="room-img deluxe">✨</div>
      <div class="room-body">
        <div class="room-name">Deluxe Twin</div>
        <div class="room-desc">Two semi-double beds, sofa, full hotel amenities, and stunning harbor view.</div>
        <div class="room-price">From ¥14,000 / night</div>
      </div>
    </div>
  </div>
</div>

<!-- AMENITIES -->
<div style="background: white; padding: 64px 0;">
  <div class="section" style="padding-top: 0; padding-bottom: 0;">
    <div class="section-title">Amenities</div>
    <div class="section-sub">Everything you need for the perfect Okinawa stay.</div>
    <div class="amenities-grid">
      <div class="amenity"><div class="amenity-icon">📶</div><div class="amenity-name">Free WiFi</div></div>
      <div class="amenity"><div class="amenity-icon">🏍️</div><div class="amenity-name">Bike Rental</div></div>
      <div class="amenity"><div class="amenity-icon">☕</div><div class="amenity-name">Cafe & Bar</div></div>
      <div class="amenity"><div class="amenity-icon">💻</div><div class="amenity-name">Coworking Space</div></div>
      <div class="amenity"><div class="amenity-icon">🧺</div><div class="amenity-name">Laundry</div></div>
      <div class="amenity"><div class="amenity-icon">🛁</div><div class="amenity-name">Shared Lounge</div></div>
      <div class="amenity"><div class="amenity-icon">🤿</div><div class="amenity-name">Snorkel Rental</div></div>
      <div class="amenity"><div class="amenity-icon">🧳</div><div class="amenity-name">Luggage Storage</div></div>
    </div>
  </div>
</div>

<!-- LOCATION -->
<div class="location-section">
  <div class="location-inner">
    <div class="map-placeholder">🗺️</div>
    <div class="location-info">
      <h3>Prime Location in Tomari</h3>
      <ul class="location-list">
        <li><span>🛥️</span> 1 min walk from Tomari Port (Kerama Islands ferry)</li>
        <li><span>🚝</span> 15 min walk from Miebashi Station (Yui Rail)</li>
        <li><span>✈️</span> 20 min by car from Naha Airport</li>
        <li><span>🐟</span> 5 min walk to Tomari Fish Market</li>
        <li><span>🏖️</span> Short walk to Naminoue Beach</li>
        <li><span>🛍️</span> 20 min walk to Kokusai Dori</li>
      </ul>
    </div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <strong>My Place Guesthouse</strong><br>
  Seasir Tomari Building, 3-1-8 Tomari, Naha, Okinawa 900-0012<br>
  📞 +81 80-8569-2887 · ✉️ myplace-okinawa@seasir.com · 🌐 myplace-guesthouse.com<br><br>
  <span style="font-size:11px;opacity:0.5;">AI Concierge powered by <strong style="color:rgba(0,212,255,0.7)">NiteBot</strong> · 24時間対応</span>
</footer>

<!-- NITEBOT FLOATING WIDGET -->
<div class="chat-fab" id="chatFab">
  <div class="chat-tooltip" id="tooltip">💬 Ask me anything!</div>
  <button class="chat-bubble-btn" onclick="toggleChat()" id="fabBtn">NB</button>
  <div class="chat-pulse"></div>
</div>
<div class="chat-panel" id="chatPanel">
  <iframe src="/" id="chatFrame"></iframe>
</div>

<script>
  let open = false;
  let tooltipHidden = false;

  setTimeout(() => {
    const t = document.getElementById('tooltip');
    if (!tooltipHidden) { t.style.opacity = '0'; t.style.transition = 'opacity 0.5s'; }
  }, 4000);

  function toggleChat() {
    open = !open;
    tooltipHidden = true;
    document.getElementById('tooltip').style.display = 'none';
    const panel = document.getElementById('chatPanel');
    const btn = document.getElementById('fabBtn');
    if (open) {
      panel.style.display = 'block';
      btn.textContent = '✕';
    } else {
      panel.style.display = 'none';
      btn.textContent = 'NB';
    }
  }
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_PAGE);
    return;
  }
  if (req.method === "GET" && req.url === "/demo") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(DEMO_PAGE);
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
