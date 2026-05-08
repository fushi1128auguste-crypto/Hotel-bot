const http = require("http");
const https = require("https");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const PORT = process.env.PORT || 3000;

const HOTEL_KNOWLEDGE = `
You are a friendly hotel concierge for Okinawa Guesthouse, a small guesthouse in Naha, Okinawa, Japan.

HOTEL INFORMATION:
- Name: Okinawa Guesthouse
- Address: 2-5-3 Makishi, Naha, Okinawa 900-0013
- Check-in: 3:00 PM - 9:00 PM (early check-in available on request)
- Check-out: 11:00 AM (late check-out available on request)
- WiFi Name: OkinawaGuesthouse_Free
- WiFi Password: welcome2okinawa
- Breakfast: Simple Japanese breakfast 7:00 AM - 9:00 AM, ¥500 per person (reserve night before)
- Parking: No private parking. Coin parking 3 min walk (~¥200/hour)
- Front desk hours: 8:00 AM - 9:00 PM
- Emergency contact: 090-1234-5678
- Nearest station: Makishi Station (Yui Rail monorail) - 5 min walk
- From Naha Airport: Yui Rail to Makishi Station (~15 min)
- Distance to Kokusai Street: 10 min walk

NEARBY RESTAURANTS:
- Yunangi (Okinawan cuisine) - 3 min walk
- Makishi Public Market (fresh seafood) - 5 min walk
- FamilyMart convenience store - 1 min walk
- McDonald's - 7 min walk

HOUSE RULES:
- Quiet hours: 10:00 PM - 8:00 AM
- No smoking indoors (smoking area outside)
- No outside guests in rooms after 10:00 PM
- Please remove shoes at entrance

LANGUAGE RULE - CRITICAL:
Detect the language the guest is writing in and ALWAYS reply in that exact same language.
English → reply in English
Japanese → reply in Japanese (日本語)
Korean → reply in Korean (한국어)
Chinese → reply in Chinese (中文)

STYLE: Warm, friendly, concise. Short paragraphs easy to read on a phone. Feel like a helpful local, not a robot.
If you don't know something, say: "Please ask our staff directly - we're happy to help!"
Never make up information not listed above.
`;

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Okinawa Guesthouse Concierge</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1rem; }
  .chat-container { width: 100%; max-width: 420px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); display: flex; flex-direction: column; height: 600px; }
  .chat-header { background: #1a6b4a; padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
  .chat-header .avatar { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .chat-header .info { flex: 1; }
  .chat-header .name { font-size: 14px; font-weight: 600; color: white; }
  .chat-header .status { font-size: 11px; color: rgba(255,255,255,0.75); }
  .online-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; }
  .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .message { display: flex; gap: 8px; align-items: flex-end; }
  .message.user { flex-direction: row-reverse; }
  .message .avatar { width: 28px; height: 28px; border-radius: 50%; background: #1a6b4a; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
  .message.user .avatar { background: #e0f0ff; color: #1a6b4a; font-size: 11px; font-weight: 600; }
  .bubble { padding: 10px 13px; max-width: 78%; font-size: 13px; line-height: 1.55; white-space: pre-wrap; }
  .message.bot .bubble { background: #f1f5f3; color: #1a1a1a; border-radius: 12px 12px 12px 2px; }
  .message.user .bubble { background: #1a6b4a; color: white; border-radius: 12px 12px 2px 12px; }
  .typing .bubble { background: #f1f5f3; border-radius: 12px 12px 12px 2px; padding: 12px 16px; }
  .typing-dots { display: flex; gap: 4px; }
  .typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: #aaa; animation: bounce 1.2s infinite; }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
  .quick-replies { padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 6px; border-top: 1px solid #f0f0f0; }
  .quick-reply { font-size: 11px; padding: 5px 11px; border-radius: 20px; background: white; border: 1px solid #ddd; color: #555; cursor: pointer; transition: background 0.15s; }
  .quick-reply:hover { background: #f1f5f3; border-color: #1a6b4a; color: #1a6b4a; }
  .input-area { padding: 10px 12px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; align-items: center; }
  .input-area input { flex: 1; padding: 9px 14px; border: 1px solid #e0e0e0; border-radius: 24px; font-size: 13px; outline: none; }
  .input-area input:focus { border-color: #1a6b4a; }
  .send-btn { width: 36px; height: 36px; border-radius: 50%; background: #1a6b4a; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; flex-shrink: 0; transition: background 0.15s; }
  .send-btn:hover { background: #155a3e; }
</style>
</head>
<body>
<div class="chat-container">
  <div class="chat-header">
    <div class="avatar">🏨</div>
    <div class="info">
      <div class="name">Okinawa Guesthouse</div>
      <div class="status">Virtual Concierge · 24/7</div>
    </div>
    <div class="online-dot"></div>
  </div>
  <div class="messages" id="messages">
    <div class="message bot">
      <div class="avatar">🏨</div>
      <div class="bubble">Welcome to Okinawa Guesthouse! 🌺

I'm your virtual concierge, available 24/7. Ask me anything about check-in, WiFi, directions, nearby restaurants, or house rules.

Feel free to ask in English, 日本語, 한국어, or 中文!</div>
    </div>
  </div>
  <div class="quick-replies">
    <button class="quick-reply" onclick="sendQuick('What time is check-in?')">Check-in time?</button>
    <button class="quick-reply" onclick="sendQuick('What is the WiFi password?')">WiFi password?</button>
    <button class="quick-reply" onclick="sendQuick('Any restaurants nearby?')">Nearby food?</button>
    <button class="quick-reply" onclick="sendQuick('チェックインは何時ですか？')">日本語</button>
  </div>
  <div class="input-area">
    <input type="text" id="input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendMessage()" />
    <button class="send-btn" onclick="sendMessage()">↑</button>
  </div>
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

  function addMessage(text, role) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message ' + role;
    const avatarText = role === 'bot' ? '🏨' : 'You';
    div.innerHTML = '<div class="avatar">' + avatarText + '</div><div class="bubble">' + text.replace(/</g,'&lt;') + '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message bot typing';
    div.id = 'typing';
    div.innerHTML = '<div class="avatar">🏨</div><div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
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
  console.log("Hotel bot running on port " + PORT);
});
